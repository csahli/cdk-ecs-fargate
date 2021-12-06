import { App, Stack, StackProps } from "@aws-cdk/core";
import * as rds from "@aws-cdk/aws-rds";
import {
  Port,
  InstanceClass,
  InstanceSize,
  InstanceType,
  Peer,
  SecurityGroup,
  Vpc,
} from "@aws-cdk/aws-ec2";
import * as secretsmanager from "@aws-cdk/aws-secretsmanager";
import {
  PredefinedMetric,
  ScalableTarget,
  ServiceNamespace,
} from "@aws-cdk/aws-applicationautoscaling";

interface RDSStackProps extends StackProps {
  vpc: Vpc;
  clusterEngine: "auroraMysql" | "auroraPostgres";
}

export class CdkDBStack extends Stack {
  
  public readonly dbAdminUserSecret: rds.DatabaseSecret;

  constructor(scope: App, id: string, props: RDSStackProps) {
    super(scope, id, props);

    const sg = new SecurityGroup(this, "DBSecurityGroup", {
      allowAllOutbound: false,
      vpc: props.vpc,
      description: "ECS DB Security Group",
    });

    let engine = "AuroraMySQL";
    let dbPort = 3306;
    let rotationApp =
      secretsmanager.SecretRotationApplication.MYSQL_ROTATION_SINGLE_USER;
    let dbEngine = rds.DatabaseClusterEngine.auroraMysql({
      version: rds.AuroraMysqlEngineVersion.VER_2_10_1,
    });
    if (props.clusterEngine === "auroraPostgres") {
      dbEngine = rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_12_8,
      });
      rotationApp =
        secretsmanager.SecretRotationApplication.POSTGRES_ROTATION_SINGLE_USER;
      engine = "AuroraPostgreSQL";
      dbPort = 5432;
    }

    const subnets = props.vpc.selectSubnets({
      subnetGroupName: "application",
    }).subnets;
    subnets.forEach((item) => {
      sg.addIngressRule(
        Peer.ipv4(item.ipv4CidrBlock),
        Port.tcp(dbPort),
        `Allow ${engine} access from the VPC application subnet cidr ${item.ipv4CidrBlock} - ${item.availabilityZone} - ${item.subnetId}`
      );
    });

    this.dbAdminUserSecret = new rds.DatabaseSecret(
      this,
      "DbAdminUserSecret",
      {
        username: "dbadminuser",
      }
    );
    const dbUserSecret = new rds.DatabaseSecret(this, "DbUserSecret", {
      username: "dbappuser",
      masterSecret: this.dbAdminUserSecret,
    });

    const cluster = new rds.DatabaseCluster(this, "Database", {
      engine: dbEngine,
      credentials: rds.Credentials.fromSecret(this.dbAdminUserSecret),
      instanceProps: {
        vpc: props.vpc,
        vpcSubnets: props.vpc.selectSubnets({
          onePerAz: true,
          subnetGroupName: "rds",
        }),
        performanceInsightRetention: 7,
        instanceType: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
        securityGroups: [sg],
      },
      storageEncrypted: true,
    });

    new secretsmanager.SecretRotation(this, "DbAdminUserSecretRotation", {
      application: rotationApp,
      secret: cluster.secret!,
      target: cluster,
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({
        onePerAz: true,
        subnetGroupName: "application",
      }),
    });

    const dbUserSecretAttached = dbUserSecret.attach(cluster);
    new secretsmanager.SecretRotation(this, "DbUserSecretRotation", {
      application:
        secretsmanager.SecretRotationApplication.POSTGRES_ROTATION_MULTI_USER,
      secret: dbUserSecretAttached,
      masterSecret: cluster.secret,
      target: cluster,
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({
        onePerAz: true,
        subnetGroupName: "application",
      }),
    });

    const readCapacity = new ScalableTarget(this, "rdsScaling", {
      serviceNamespace: ServiceNamespace.RDS,
      minCapacity: 2,
      maxCapacity: 3,
      resourceId: "cluster:" + cluster.clusterIdentifier,
      scalableDimension: "rds:cluster:ReadReplicaCount",
    });

    readCapacity.scaleToTrackMetric("rdsScalingTracking", {
      targetValue: 60,
      predefinedMetric: PredefinedMetric.RDS_READER_AVERAGE_CPU_UTILIZATION,
    });
  }
}
