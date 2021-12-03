import { App, Stack, StackProps } from "@aws-cdk/core";
import * as sqs from "@aws-cdk/aws-sqs";



export class CdkSQSStack extends Stack{
    constructor(scope: App, id: string, props?: StackProps){
        super(scope, id, props)

        const sqsQ = new sqs.Queue(this, 'SQSQueue', {
            encryption: sqs.QueueEncryption.KMS_MANAGED
        });

    }
}