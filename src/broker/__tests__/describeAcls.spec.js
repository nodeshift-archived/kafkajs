const { createConnection, connectionOpts, secureRandom, newLogger } = require('testHelpers')

const Broker = require('../index')
const ACL_RESOURCE_TYPES = require('../../protocol/aclResourceTypes')
const ACL_OPERATION_TYPES = require('../../protocol/aclOperationTypes')
const ACL_PERMISSION_TYPES = require('../../protocol/aclPermissionTypes')
const RESOURCE_PATTERN_TYPES = require('../../protocol/resourcePatternTypes')

describe('Broker > describeAcls', () => {
  let seedBroker, broker

  beforeEach(async () => {
    seedBroker = new Broker({
      connection: createConnection(connectionOpts()),
      logger: newLogger(),
    })
    await seedBroker.connect()

    const metadata = await seedBroker.metadata()
    const newBrokerData = metadata.brokers.find(b => b.nodeId === metadata.controllerId)

    broker = new Broker({
      connection: createConnection(newBrokerData),
      logger: newLogger(),
    })
  })

  afterEach(async () => {
    seedBroker && (await seedBroker.disconnect())
    broker && (await broker.disconnect())
  })

  // KafkaJSProtocolError: Cluster authorization failed
  test.skip('request', async () => {
    await broker.connect()

    const topicName = `test-topic-${secureRandom()}`
    const principal = `User:bob-${secureRandom()}`
    const acl = {
      resourceType: ACL_RESOURCE_TYPES.TOPIC,
      resourceName: topicName,
      resourcePatternType: RESOURCE_PATTERN_TYPES.LITERAL,
      principal,
      host: '*',
      operation: ACL_OPERATION_TYPES.ALL,
      permissionType: ACL_PERMISSION_TYPES.ALLOW,
    }

    await broker.createAcls({ acl: [acl] })
    const response = await broker.describeAcls({
      // no principal
      resourceName: acl.resourceName,
      resourceType: acl.resourceType,
      host: acl.host,
      permissionType: acl.permissionType,
      operation: acl.operation,
      resourcePatternType: acl.resourcePatternType,
    })

    expect(response).toEqual({
      clientSideThrottleTime: expect.optional(0),
      throttleTime: 0,
      errorCode: 0,
      errorMessage: null,
      resources: [
        {
          resourceType: ACL_RESOURCE_TYPES.TOPIC,
          resourceName: topicName,
          resourcePatternType: RESOURCE_PATTERN_TYPES.LITERAL,
          acls: [
            {
              principal,
              host: '*',
              operation: ACL_OPERATION_TYPES.ALL,
              permissionType: ACL_PERMISSION_TYPES.ALLOW,
            },
          ],
        },
      ],
    })
  })
})
