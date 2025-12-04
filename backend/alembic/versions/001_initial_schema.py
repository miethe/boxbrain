"""Initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2025-11-25 16:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Assets ---
    op.create_table('assets',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('original_filename', sa.String(), nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('mime_type', sa.String(), nullable=True),
        sa.Column('size_bytes', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('file_path')
    )

    # --- Asset Metadata ---
    op.create_table('asset_metadata',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('asset_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('author', sa.String(), nullable=True),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('confidentiality', sa.String(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('asset_id')
    )
    op.create_index(op.f('ix_asset_metadata_id'), 'asset_metadata', ['id'], unique=False)

    # --- Tags ---
    op.create_table('tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_tags_id'), 'tags', ['id'], unique=False)

    # --- Asset Tags ---
    op.create_table('asset_tags',
        sa.Column('asset_id', sa.String(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id'], ),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ),
        sa.PrimaryKeyConstraint('asset_id', 'tag_id')
    )

    # --- GTM Plays ---
    op.create_table('gtm_plays',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('offering', sa.String(), nullable=True),
        sa.Column('industry', sa.String(), nullable=True),
        sa.Column('region', sa.String(), nullable=True),
        sa.Column('sales_stage', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_gtm_plays_id'), 'gtm_plays', ['id'], unique=False)

    # --- Play Tags ---
    op.create_table('play_tags',
        sa.Column('play_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['play_id'], ['gtm_plays.id'], ),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ),
        sa.PrimaryKeyConstraint('play_id', 'tag_id')
    )

    # --- Metadata Dictionaries ---
    op.create_table('offerings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_offerings_id'), 'offerings', ['id'], unique=False)

    op.create_table('technologies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('offering_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['offering_id'], ['offerings.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_technologies_id'), 'technologies', ['id'], unique=False)

    op.create_table('sectors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_sectors_id'), 'sectors', ['id'], unique=False)

    op.create_table('geos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_geos_id'), 'geos', ['id'], unique=False)

    op.create_table('stages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_stages_id'), 'stages', ['id'], unique=False)

    op.create_table('asset_collections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_asset_collections_id'), 'asset_collections', ['id'], unique=False)

    # --- Asset GTM Play Association ---
    op.create_table('asset_gtm_plays',
        sa.Column('asset_id', sa.String(), nullable=False),
        sa.Column('play_id', sa.Integer(), nullable=False),
        sa.Column('phase', sa.String(), nullable=False),
        sa.Column('purpose', sa.String(), nullable=True),
        sa.Column('collection_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id'], ),
        sa.ForeignKeyConstraint(['play_id'], ['gtm_plays.id'], ),
        sa.ForeignKeyConstraint(['collection_id'], ['asset_collections.id'], ),
        sa.PrimaryKeyConstraint('asset_id', 'play_id')
    )


def downgrade() -> None:
    op.drop_table('asset_gtm_plays')
    op.drop_index(op.f('ix_asset_collections_id'), table_name='asset_collections')
    op.drop_table('asset_collections')
    op.drop_index(op.f('ix_stages_id'), table_name='stages')
    op.drop_table('stages')
    op.drop_index(op.f('ix_geos_id'), table_name='geos')
    op.drop_table('geos')
    op.drop_index(op.f('ix_sectors_id'), table_name='sectors')
    op.drop_table('sectors')
    op.drop_index(op.f('ix_technologies_id'), table_name='technologies')
    op.drop_table('technologies')
    op.drop_index(op.f('ix_offerings_id'), table_name='offerings')
    op.drop_table('offerings')
    op.drop_table('play_tags')
    op.drop_index(op.f('ix_gtm_plays_id'), table_name='gtm_plays')
    op.drop_table('gtm_plays')
    op.drop_table('asset_tags')
    op.drop_index(op.f('ix_tags_id'), table_name='tags')
    op.drop_table('tags')
    op.drop_index(op.f('ix_asset_metadata_id'), table_name='asset_metadata')
    op.drop_table('asset_metadata')
    op.drop_table('assets')
