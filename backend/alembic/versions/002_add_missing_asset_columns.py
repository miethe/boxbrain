"""add missing asset columns

Revision ID: 002_add_missing_asset_columns
Revises: 001_initial_schema
Create Date: 2025-12-04 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002_add_missing_asset_columns'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add New V2 fields
    op.add_column('assets', sa.Column('links', sa.JSON(), nullable=True))
    op.add_column('assets', sa.Column('linked_opportunity_ids', sa.JSON(), nullable=True))
    op.add_column('assets', sa.Column('linked_asset_ids', sa.JSON(), nullable=True))
    op.add_column('assets', sa.Column('offerings', sa.JSON(), nullable=True))
    op.add_column('assets', sa.Column('linked_play_ids', sa.JSON(), nullable=True))
    op.add_column('assets', sa.Column('technologies', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('assets', 'technologies')
    op.drop_column('assets', 'linked_play_ids')
    op.drop_column('assets', 'offerings')
    op.drop_column('assets', 'linked_asset_ids')
    op.drop_column('assets', 'linked_opportunity_ids')
    op.drop_column('assets', 'links')
