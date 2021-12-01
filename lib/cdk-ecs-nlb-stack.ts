import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as s3 from '@aws-cdk/aws-s3';
import * as elb from '@aws-cdk/aws-elasticloadbalancingv2';
import { StackProps } from '@aws-cdk/core';
 
interface CdkEcsNLBStackProps extends StackProps{
  vpc: ec2.Vpc
  bucket?: s3.Bucket
}

export class CdkEcsNLBStack extends cdk.Stack {

  public readonly nlb: elb.NetworkLoadBalancer;

  constructor(scope: cdk.App, id: string, props: CdkEcsNLBStackProps) {
    super(scope, id, props);
    
    const {vpc} = props;
    this.nlb = new elb.NetworkLoadBalancer(this, 'NLB', {
      vpc: vpc,
      vpcSubnets: vpc.selectSubnets({onePerAz: true, subnetGroupName: 'ingress'}),
      crossZoneEnabled: true,
      internetFacing: false,
    });

    if ('bucket' in props && props.bucket !== undefined ) this.nlb.logAccessLogs(props.bucket);
  }
}
