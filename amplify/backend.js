import { addApi } from 'amplify-category-api';
import { createFunction } from 'amplify-category-function';

const apiName = 'myApi';
const apiPlugin = 'awscloudformation';
const apiService = 'AppSync';
const apiProvider = undefined;
const apiParams = {
  service: apiService,
  providerPlugin: apiPlugin,
  providerName: apiProvider,
  apiName: apiName,
  functionTemplate: undefined,
  path: '/api',
  modelName: undefined,
  rdsRegion: undefined,
  rdsClusterIdentifier: undefined,
  rdsSecretStoreArn: undefined,
  rdsDatabaseName: undefined,
  dynamodbRegion: undefined,
  dynamodbTableName: undefined,
  authConfig: undefined,
  skipCompile: undefined,
  usingCdk: undefined,
};

const apiResource = await addApi(context, apiParams);

if (apiResource) {
  const functionParams = {
    functionTemplate: 'Hello World',
    resourceName: 'helloWorld',
    service: 'Lambda',
    functionPlugin: 'awscloudformation',
    providerName: undefined,
    dependsOn: [apiResource],
  };

  await createFunction(context, functionParams);
}
