import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway'
import { join } from 'path';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';

export class AwsProjectTrackerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    
    const memberTable = new Table(this, 'project-member-tbl', {
      partitionKey: { name: 'id', type: AttributeType.STRING},
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
   });

   const taskTable = new Table(this, 'project-task-tbl', {
    partitionKey: { name: 'id', type: AttributeType.STRING},
    billingMode: BillingMode.PAY_PER_REQUEST,
    removalPolicy: cdk.RemovalPolicy.DESTROY
 });


   const handlerFunction = new Function(this, 'projectmgmtHandler', {
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromAsset(join(__dirname, '../lambdas')),
      handler: 'app.handler',
      environment: {
        MEM_TABLE: memberTable.tableName,
        TASK_TABLE: taskTable.tableName
      }
   });

   // grant permission
   memberTable.grantReadWriteData(handlerFunction);
   taskTable.grantReadWriteData(handlerFunction);

   const api = new RestApi(this, 'project-mgmt-api', {
      description: 'Project Management Tracker API',
 
   });

   // Integration
   const handlerIntegration = new LambdaIntegration(handlerFunction);

   const mainPath = api.root.addResource("projectmgmt");
   const managerPath = mainPath.addResource("manager");
   const memberPath = mainPath.addResource("member");
   const idPath = memberPath.addResource("{id}");
   const getAllPath = managerPath.addResource("list");
   const saveMemPath = managerPath.addResource("add-member");
   const saveTaskPath = managerPath.addResource("assign-task");

   getAllPath.addMethod("GET",handlerIntegration); // get all
   saveMemPath.addMethod("POST", handlerIntegration); // post a member
   saveTaskPath.addMethod("POST", handlerIntegration); // post a member

   idPath.addMethod("DELETE", handlerIntegration);
   idPath.addMethod("GET", handlerIntegration);
   idPath.addMethod("PUT", handlerIntegration);

  }
}
