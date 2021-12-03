#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { Capture, Match, Template } from "@aws-cdk/assertions";

import { CdkEcsStack } from '../lib/cdk-ecs-stack';
import { CdkEcsNLBStack } from '../lib/cdk-ecs-nlb-stack';
import { CdkEcsVPCStack } from '../lib/cdk-ecs-vpc-stack';
import { CdkDBStack } from '../lib/cdk-ecs-rds-stack';

const app = new cdk.App();
const vpcStack = new CdkEcsVPCStack(app, 'EcsVPCStack');
// const nlbStack = new CdkEcsNLBStack(app, 'EcsNLBStack', {vpc: vpcStack.vpc});
const rdsStack = new CdkDBStack(app, 'ECSDBClusterStack', {vpc: vpcStack.vpc, clusterEngine: 'auroraMysql'});
// const ecsStack = new CdkEcsStack(app, 'EcsStack', { vpc: vpcStack.vpc, nlb: nlbStack.nlb, image: '910537616703.dkr.ecr.us-east-1.amazonaws.com/nginx:test' });

const templateVPC = Template.fromStack(vpcStack);
const templateDB = Template.fromStack(rdsStack);
// const templateNLB = Template.fromStack(nlbStack);
// const templateECS = Template.fromStack(ecsStack);

describe('Network Check', () => {
    test('VPC Created', () => {
        templateVPC.resourceCountIs("AWS::EC2::VPC", 1);
    });

    test('Subnet Created', () => {
        templateVPC.resourceCountIs("AWS::EC2::Subnet", 8);
    });
});

describe('DB Stack Check', () => {

    
    test('DB Created', () => {
        templateDB.resourceCountIs("AWS::RDS::DBCluster", 1);
    });
    test('DB SG Created', () => {
        templateDB.resourceCountIs("AWS::EC2::SecurityGroup", 3);
    });
    test('DB SecretRotationSchedule Created', () => {
        templateDB.resourceCountIs("AWS::SecretsManager::RotationSchedule", 2);
    });
    test('DB Storage encrypted', () => {
        templateDB.hasResourceProperties("AWS::RDS::DBCluster", {
            StorageEncrypted: true,
        });
    });
});