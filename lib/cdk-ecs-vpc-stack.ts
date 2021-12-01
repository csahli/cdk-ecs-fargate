import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

 

export class CdkEcsVPCStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    

    this.vpc = new ec2.Vpc(this, 'VPC', {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'ingress',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'application',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        {
          cidrMask: 28,
          name: 'rds',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        {
          cidrMask: 24,
          name: 'infra',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
     ],

    });

    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3, 
    });

    this.vpc.addInterfaceEndpoint('ECREndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
      subnets:
        {
          //subnetType: ec2.SubnetType.PRIVATE_ISOLATED, 
          onePerAz: true,  
          subnetGroupName: 'infra'
        }
    });

    this.vpc.addInterfaceEndpoint('ECS', {service: ec2.InterfaceVpcEndpointAwsService.ECS,subnets:{onePerAz: true, subnetGroupName: 'infra'}});
    this.vpc.addInterfaceEndpoint('ECSAgent', {service: ec2.InterfaceVpcEndpointAwsService.ECS_AGENT,subnets:{onePerAz: true, subnetGroupName: 'infra'}});
    this.vpc.addInterfaceEndpoint('ECSTelemetry', { service: ec2.InterfaceVpcEndpointAwsService.ECS_TELEMETRY, subnets: {onePerAz: true, subnetGroupName: 'infra' } });
    this.vpc.addInterfaceEndpoint('CW', { service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH, subnets: {onePerAz: true, subnetGroupName: 'infra' } });
    this.vpc.addInterfaceEndpoint('CWLogs', { service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS, subnets: {onePerAz: true, subnetGroupName: 'infra' } });
    this.vpc.addInterfaceEndpoint('CWEvents', { service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_EVENTS, subnets: {onePerAz: true, subnetGroupName: 'infra' } });

  }
}
