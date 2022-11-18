import {Injectable, Req, Res} from '@nestjs/common';
import * as AWS from "aws-sdk";

@Injectable()
export class S3Service {
    AWS_S3_BUCKET = 'tangi-commerce';
    s3 = new AWS.S3
    ({
        accessKeyId: 'AKIAYMY4XWUCJX55AHUH',
        secretAccessKey: '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',
    });

    async uploadFile(file) {
        const {originalname} = file;
        const d = await this.s3_upload(file.buffer, this.AWS_S3_BUCKET, originalname, file.mimetype);
        return {location: d?.Location}
    }


    async s3_upload(file, bucket, name, mimetype) {
        const params =
            {
                Bucket: bucket,
                Key: String(name),
                Body: file,
                ACL: "public-read",
                ContentType: mimetype,
                ContentDisposition: "inline",
                CreateBucketConfiguration:
                    {
                        LocationConstraint: "ap-south-1"
                    }
            };

        try {
            return this.s3.upload(params).promise();
        } catch (e) {
            console.log(e);
        }
    }
}

