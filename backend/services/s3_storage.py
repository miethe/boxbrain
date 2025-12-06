import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile, HTTPException
from .storage import StorageProvider
import os
import uuid

class S3StorageProvider(StorageProvider):
    def __init__(self, bucket_name: str, region_name: str, aws_access_key_id: str = None, aws_secret_access_key: str = None):
        self.bucket_name = bucket_name
        self.region_name = region_name
        self.s3_client = boto3.client(
            's3',
            region_name=region_name,
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key
        )

    async def save(self, file: UploadFile, directory: str = "") -> str:
        try:
            # Generate a unique key
            # We use the directory as a prefix if provided
            key = f"{directory}/{file.filename}" if directory else file.filename
            
            # Remove leading slash if present to avoid empty folder at root
            if key.startswith("/"):
                key = key[1:]

            self.s3_client.upload_fileobj(
                file.file,
                self.bucket_name,
                key,
                ExtraArgs={'ContentType': file.content_type}
            )
            return key
        except ClientError as e:
            print(f"S3 Upload Error: {e}")
            raise HTTPException(status_code=500, detail=f"S3 Upload failed: {str(e)}")

    def get_url(self, path: str) -> str:
        # Generate a presigned URL or public URL depending on requirements.
        # For now, let's assume public accessible or presigned.
        # Let's generate a presigned URL for safety and compatibility with private buckets
        try:
            response = self.s3_client.generate_presigned_url('get_object',
                                                            Params={'Bucket': self.bucket_name,
                                                                    'Key': path},
                                                            ExpiresIn=3600)
            return response
        except ClientError as e:
             print(f"S3 Presign Error: {e}")
             return ""

    def delete(self, path: str) -> bool:
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=path)
            return True
        except ClientError as e:
            print(f"S3 Delete Error: {e}")
            return False
