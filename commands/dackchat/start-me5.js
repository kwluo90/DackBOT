const AWS = require('aws-sdk');
const commando = require('discord.js-commando');
const discord = require('discord.js');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

AWS.config.update({region: 'us-west-2'});

var ec2 = new AWS.EC2({apiVersion: '2016-11-15'});

const startme5 = async (msg) => {
    let channel = msg.channel;

    var params = {
        SpotFleetRequestConfig: {
            IamFleetRole: "arn:aws:iam::523775743690:role/aws-ec2-spot-fleet-tagging-role",
            AllocationStrategy: "capacityOptimized",
            TargetCapacity: 1,
            Type: "request",
            LaunchTemplateConfigs: [
                {
                    LaunchTemplateSpecification: {
                        LaunchTemplateId: "lt-0aed89efdd765cc87",
                        Version: "1"
                    },
                    Overrides: [
                    {
                        InstanceType: "r5.large",
                        WeightedCapacity: 1,
                        SubnetId: "subnet-34ec5a7d"
                    },
                    {
                        InstanceType: "r5.large",
                        WeightedCapacity: 1,
                        SubnetId: "subnet-97c35ff0"
                    },
                    {
                        InstanceType: "r5.large",
                        WeightedCapacity: 1,
                        SubnetId: "subnet-28a5ae70"
                    },
                    {
                        InstanceType: "r5.large",
                        WeightedCapacity: 1,
                        SubnetId: "subnet-2bb24900"
                    }
                ]
                }
            ]
        }
    };
    
    try {
        var spotFleetRequestId;
        let data = await ec2.requestSpotFleet(params).promise();
        console.log(data);
        spotFleetRequestId = data.SpotFleetRequestId;
    } catch (err) {
        console.log(err, err.stack);
        channel.send('ERROR: ' + err);
        return;
    }
  
    // Send ack to channel that it is starting
    
    channel.send('ACK, startng server. SAVE THIS MESSAGE! The fleet request id is: ' + spotFleetRequestId);
    
    // Wait until instance ip is available
    var describeInstanceParams = {
      Filters: [
          {
              Name: "tag:aws:ec2spot:fleet-request-id",
              Values: [
                  spotFleetRequestId
              ]
          }
      ]
    };
  
    var maxRetryCount = 5;
    var retry = 0;
    var instanceIp;
    var retryDelayInSeconds = 10;
    while (retry < maxRetryCount) {
        console.log("Polling for ip address. Attempt #" + retry);
        await sleep(retryDelayInSeconds * 1000);
        retry++;
        retryDelayInSeconds += 10;
        
        try {
            let data = await ec2.describeInstances(describeInstanceParams).promise();
            if (data.Reservations && data.Reservations[0] && data.Reservations[0].Instances) {
                instanceIp = data.Reservations[0].Instances[0].PublicIpAddress;
                console.log("Found instance ip: " + instanceIp);
                break;
            }
        } catch (err) {
            console.log(err, err.stack);
            channel.send('ERROR: ' + err);
            return;
        }
    }
  
    // send instance ip to chat
    channel.send('The ip address is: ' + instanceIp + ' -- please wait 5-10 minutes while the MC server initializes.');
  }

module.exports = class startme5Command extends commando.Command {
  constructor(client) {
    console.log("Registering Start Minecraft command...");
    super(client, {
      name: 'startme5',
      aliases: ['startme5'],
      group: 'dackchat',
      memberName: 'startme5',
      description: 'Starts the DACK minecraft server',
      examples: ['startme5']
    });
  }

  async run(msg, {url}) {
    console.log("Bot detected startme5 command from " + msg.author);
    return await startme5(msg);
  }
}