import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as elb from '@aws-cdk/aws-elasticloadbalancingv2';
import * as apiv2 from '@aws-cdk/aws-apigatewayv2';
import * as apiIntegration from '@aws-cdk/aws-apigatewayv2-integrations';
import * as secretsmanager from "@aws-cdk/aws-secretsmanager";

interface ECSStackProps extends cdk.StackProps{
  vpc: ec2.Vpc;
  image: string;
  dbSecret: secretsmanager.Secret;
  nlb: elb.NetworkLoadBalancer;
  //alb?: elb.ApplicationLoadBalancer;
}

export class CdkEcsStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props: ECSStackProps) {
    super(scope, id, props);
    
    const {vpc} = props;
    const subnets = vpc.selectSubnets({onePerAz: true, subnetGroupName: 'application'});

    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: vpc,
      containerInsights: true,
      enableFargateCapacityProviders: true
    });

    const logging = new ecs.AwsLogDriver({
      streamPrefix: "ApplicationLogStream",
    })

    const taskDef = new ecs.FargateTaskDefinition(this, 'AppTaskDefinition', {
      cpu: 1024,
      memoryLimitMiB: 2048,
    });



    taskDef.addContainer("AppContainer", {
      image: ecs.ContainerImage.fromRegistry(props.image),
      memoryLimitMiB: 256,
      essential: true,
      logging,
      portMappings: [{ containerPort: 8080, protocol: ecs.Protocol.TCP},],
      secrets: {
        "DBHOST": ecs.Secret.fromSecretsManager(props.dbSecret, 'host'),
        "DBPORT": ecs.Secret.fromSecretsManager(props.dbSecret, 'port'),
        "DBUSER": ecs.Secret.fromSecretsManager(props.dbSecret, 'username'),
        "DBPASS": ecs.Secret.fromSecretsManager(props.dbSecret, 'password'),
      },
      environment: { "NODEPORT": "8080" }
    });

    const taskDefExecRolePolicyStmt = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [            
              'ecr:GetAuthorizationToken',
              'ecr:BatchCheckLayerAvailability',
              'ecr:GetDownloadUrlForLayer',
              'ecr:BatchGetImage',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              "secretsmanager:GetSecretValue",
              "kms:Decrypt"
            ],
            resources: ["*"],
          });

    taskDef.addToExecutionRolePolicy(taskDefExecRolePolicyStmt);
    
    const appSG = new ec2.SecurityGroup(this, 'AppSG', {
      vpc,
      description: `ECS Fargate Service Application Security Group`,
      allowAllOutbound: true,
    });

    appSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.allTcp());
    
    const service = new ecs.FargateService(this, "AppService", {
      cluster,
      taskDefinition: taskDef,
      assignPublicIp: false,
      desiredCount: 2,
      vpcSubnets: subnets,
      securityGroups: [ appSG ],
    });

    const nlb = props.nlb 
    const listener = nlb.addListener('NLBListener', {port: 80,});
    listener.addTargets('NLBListenerTargets', {
        targets: [service],
        port: 80,
      });

    const httpEndpoint = new apiv2.HttpApi(this, 'HttpProxyPrivateApi', {
      defaultIntegration: new apiIntegration.HttpNlbIntegration({
        listener,
        vpcLink: new apiv2.VpcLink(this, 'HTTPAPIVPCLink', {
          vpc: vpc,
          subnets: vpc.selectSubnets({onePerAz: true, subnetGroupName: 'ingress'})
        })
      }),
    });

  }
}
