const AWS = require("aws-sdk");
let dynamo = new AWS.DynamoDB.DocumentClient();

const MEM_TABLE = process.env.MEM_TABLE;
const TASK_TABLE = process.env.TASK_TABLE;
const MY_TABLE = process.env.MEM_TABLE;

exports.handler = async (event, context) => {
  console.log("Request Event:::", event);
  let path = event.resource;
  let httpMethod = event.httpMethod;
  let route = httpMethod.concat(" ").concat(path);

  let data = JSON.parse(event.body);

  let body;
  let statusCode = 200;

  try {
    switch (route) {
      case "GET /projectmgmt/manager/list":
        body = await listAllMembers();
        break;
      case "POST /projectmgmt/manager/add-member":
        body = await saveMember(data);
        break;
      case "POST /projectmgmt/manager/assign-task":
        body = await saveTask(data);
        break;
      /*case "DELETE /projectmgmt/api/v1/member/list/{id}":
        body = await deleteQuote(event.pathParameters.id);
        break;
       case "PUT /quotes/{id}":
        body = await updateQuote(event.pathParameters.id, data);
        break; */
      case "GET /projectmgmt/member/{id}":
        body = await getMemTaskDetails(event.pathParameters.id);
        break;

      default:
        throw new Error(`unsupported route: "${route}`);
    }
  } catch (error) {
    console.log(error);
    statusCode = 400;
    body = error.message;
  } finally {
    console.log(body);
    body = JSON.stringify(body);
  }

  return sendRes(statusCode, body);
};


async function getMemTaskDetails(id) {

  const params = {
    TableName: MEM_TABLE,
    Key: {
      id: id,
    },
  };
  return dynamo
    .get(params)
    .promise()
    .then((item) => {
      return item.Item;
    });
}


async function getQuote(id) {
  const params = {
    TableName: MY_TABLE,
    Key: {
      id: id,
    },
  };
  return dynamo
    .get(params)
    .promise()
    .then((item) => {
      return item.Item;
    });
}

async function updateQuote(id, data) {
  const datetime = new Date().toISOString();
  const params = {
    TableName: MY_TABLE,
    Key: {
      id: id,
    },

    ExpressionAttributeValues: {
      ":quote": data.quote,
      ":author": data.author,
      ":updatedAt": datetime,
    },
    UpdateExpression:
      "SET quote = :quote, author = :author, updatedAt = :updatedAt",
    ReturnValues: "UPDATED_NEW",
  };
  await dynamo
    .update(params)
    .promise()
    .then(() => {
      return "Item updated!";
    });
}

async function deleteQuote(id) {
  const params = {
    TableName: MY_TABLE,
    Key: {
      id: id,
    },
  };
  return dynamo
    .delete(params)
    .promise()
    .then(() => {
      return id;
    });
}

async function listAllMembers() {
  const params = {
    TableName: MEM_TABLE,
  };
  return dynamo
    .scan(params)
    .promise()
    .then((data) => {
      return data.Items;
    });
}

async function saveMember(data) {
  const date = new Date();
  const time = date.getTime();

  const member = {
    id: time.toString(), //124348584
    memberId: time.toString(),
    teamMemberName: data.teamMemberName,
    noOfYearExp: data.noOfYearExp,
    profileDesc: data.profileDesc,
    allocPercent: data.allocPercent,
    projectStartDt: data.projectStartDt,
    projectEndDt: data.projectEndDt
  };
  const params = {
    TableName: MEM_TABLE,
    Item: member,
  };

  return dynamo
    .put(params)
    .promise()
    .then(() => {
      return member;
    });
}


async function saveTask(data) {
  const date = new Date();
  const time = date.getTime();

  const task = {
    id: time.toString(), //124348584
    taskId: time.toString(),
    taskName: data.taskName,
    memberId: data.memberId,
    memberName: data.memberName,
    deliverables: data.deliverables,
    taskStartDt: data.taskStartDt,
    taskEndDt: data.taskEndDt
  };
  const params = {
    TableName: TASK_TABLE,
    Item: task,
  };

  return dynamo
    .put(params)
    .promise()
    .then(() => {
      return task;
    });
}

const sendRes = (status, body) => {
  var response = {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
    },
    body,
  };
  return response;
};
