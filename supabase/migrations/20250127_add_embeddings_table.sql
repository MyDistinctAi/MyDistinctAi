-- Enable pgvector extension for vector similarity search
create extension if not exists vector;

-- Create embeddings table to store document chunks and their embeddings
create table if not exists document_embeddings (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references models(id) on delete cascade,
  training_data_id uuid not null references training_data(id) on delete cascade,

  -- Text content
  chunk_text text not null,
  chunk_index int not null,
  start_char int,
  end_char int,

  -- Vector embedding (dimension will depend on the model, typically 768 or 1536)
  embedding vector(768),

  -- Metadata
  metadata jsonb default '{}'::jsonb,

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  -- Index for faster lookups
  constraint unique_chunk unique (training_data_id, chunk_index)
);

-- Create index for vector similarity search (using cosine distance)
create index if not exists document_embeddings_embedding_idx
  on document_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Create index for model_id lookups
create index if not exists document_embeddings_model_id_idx
  on document_embeddings(model_id);

-- Create index for training_data_id lookups
create index if not exists document_embeddings_training_data_id_idx
  on document_embeddings(training_data_id);

-- Enable Row Level Security
alter table document_embeddings enable row level security;

-- Policy: Users can only access embeddings for their own models
create policy "Users can view their own embeddings"
  on document_embeddings for select
  using (
    exists (
      select 1 from models
      where models.id = document_embeddings.model_id
      and models.user_id = auth.uid()
    )
  );

-- Policy: Users can insert embeddings for their own models
create policy "Users can insert embeddings for their models"
  on document_embeddings for insert
  with check (
    exists (
      select 1 from models
      where models.id = document_embeddings.model_id
      and models.user_id = auth.uid()
    )
  );

-- Policy: Users can delete embeddings for their own models
create policy "Users can delete their own embeddings"
  on document_embeddings for delete
  using (
    exists (
      select 1 from models
      where models.id = document_embeddings.model_id
      and models.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
create or replace function update_document_embeddings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger update_document_embeddings_updated_at
  before update on document_embeddings
  for each row
  execute function update_document_embeddings_updated_at();

-- Create function for similarity search
create or replace function match_documents(
  query_embedding vector(768),
  match_model_id uuid,
  match_count int default 5,
  similarity_threshold float default 0.7
)
returns table (
  id uuid,
  model_id uuid,
  training_data_id uuid,
  chunk_text text,
  chunk_index int,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    document_embeddings.id,
    document_embeddings.model_id,
    document_embeddings.training_data_id,
    document_embeddings.chunk_text,
    document_embeddings.chunk_index,
    1 - (document_embeddings.embedding <=> query_embedding) as similarity
  from document_embeddings
  where document_embeddings.model_id = match_model_id
    and 1 - (document_embeddings.embedding <=> query_embedding) > similarity_threshold
  order by document_embeddings.embedding <=> query_embedding
  limit match_count;
end;
$$;
