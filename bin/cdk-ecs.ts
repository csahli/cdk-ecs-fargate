#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { CdkEcsStack } from "../lib/cdk-ecs-stack";
import { CdkEcsNLBStack } from "../lib/cdk-ecs-nlb-stack";
import { CdkEcsVPCStack } from "../lib/cdk-ecs-vpc-stack";
import { CdkDBStack } from "../lib/cdk-ecs-rds-stack";
import { Tags } from "@aws-cdk/core";

/* If you don't specify 'env', this stack will be environment-agnostic.
 * Account/Region-dependent features and context lookups will not work,
 * but a single synthesized template can be deployed anywhere. */

/* Uncomment the next line to specialize this stack for the AWS Account
 * and Region that are implied by the current CLI configuration. */
// env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

/* Uncomment the next line if you know exactly what Account and Region you
 * want to deploy the stack to. */
// env: { account: '123456789012', region: 'us-east-1' },

/* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */

const app = new cdk.App();
Tags.of(app).add("owner", "cdk-labs");
Tags.of(app).add("project", "supervilain");
const vpcStack = new CdkEcsVPCStack(app, "EcsVPCStack");
const nlbStack = new CdkEcsNLBStack(app, "EcsNLBStack", { vpc: vpcStack.vpc });
const rdsStackMYSQL = new CdkDBStack(app, "rdsStackMYSQL", {
  vpc: vpcStack.vpc,
  clusterEngine: "auroraMysql",
});
const rdsStackPGSQL = new CdkDBStack(app, "rdsStackPGSQL", {
  vpc: vpcStack.vpc,
  clusterEngine: "auroraPostgres",
});
const ecsStack = new CdkEcsStack(app, "EcsStack", {
  vpc: vpcStack.vpc,
  nlb: nlbStack.nlb,
  image: "910537616703.dkr.ecr.us-east-1.amazonaws.com/nodebeapp:1.0",
  dbSecret: rdsStackPGSQL.dbAdminUserSecret,
});
