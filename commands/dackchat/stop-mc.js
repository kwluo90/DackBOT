const AWS = require('aws-sdk');
const commando = require('discord.js-commando');
const discord = require('discord.js');

AWS.config.update({region: 'us-west-2'});

var ec2 = new AWS.EC2({apiVersion: '2016-11-15'});

const stopmc = async (msg, fleetid, verifystop) => {
  let channel = msg.channel;

  if (verifystop.toLowerCase() != "yes") {
      channel.send("HOLUP: Make sure you type /save-all and /stop in the minecraft server before running this command. If you have done so, retyp this command but add a 'yes' as the last argument.");
      return;
  }

  var params = {
      SplotFleetRequestIds: [
        fleetid
      ]
  };

  try{
    let data = await ec2.cancelSpotFleetRequests(params).promise();
    console.log(data);
  } catch (err) {
      console.log(err, err.stack);
      channel.send('ERROR: ' + err);
  }

  // Send ack to channel that it is stopping
  
  channel.send('ACK, stopping server.');

}

module.exports = class StopMcCommand extends commando.Command {
  constructor(client) {
    console.log("Registering Stop Minecraft command...");
    super(client, {
      name: 'stopmc',
      aliases: ['stopmc'],
      group: 'dackchat',
      memberName: 'stopmc',
      description: 'Stops the DACK minecraft server',
      examples: ['stopmc [spot_fleet_request_id] [yes if run /stop before this command]'],
      args: [
          {
              key: 'fleetId',
              label: 'fleetId',
              prompt: 'What\s the spot fleet request id?',
              type: 'string'
          },
          {
              key: 'verifystop',
              label: 'verifystop',
              prompt: 'type \'yes\' if you verify you have run the /save-all and /stop command before running this command',
              type: 'string',
              default: 'no'
          }
      ]
    });
  }

  async run(msg, {fleetid, verifystop}) {
    console.log("Bot detected stopmc command from " + msg.author);
    return await stopmc(msg, fleetid, verifystop);
  }
}