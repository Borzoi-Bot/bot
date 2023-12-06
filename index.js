const { Client, Intents, MessageEmbed } = require('discord.js');
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_PRESENCES
  ]
});

let guildId;

client.once('ready', () => {
  console.log('online');

  const guild = client.guilds.cache.first();
  if (guild) {
    guildId = guild.id;
    console.log(`Guild ID: ${guildId}`);
  } else {
    console.log('Bot is not in any guild.');
  }
// this isnt required i was just using it to see if the bot could send messages initially
  const channel = client.channels.cache.find(channel => channel.name === 'general');
  if (channel) {
    channel.send('online');
  } else {
    console.log('General channel not found.');
  }
});

client.on('guildCreate', (guild) => {
  guildId = guild.id;
  console.log(`Joined new guild. Updated Guild ID: ${guildId}`);

  const welcomeEmbed = new MessageEmbed()
    .setTitle('Thanks for adding Borzoi!')
    .setDescription('Thank you for adding Borzoi.')
    .setColor('#000000')
    .addField('Commands List:', '[UNUSED](https://example.com/link1)')
    .addField('GitHub:', '[GitHub](https://github.com/Borzoi-Bot)')
    .setImage('https://github.com/Borzoi-Bot/branding/blob/main/branding.png?raw=true');
  
  const welcomeChannel = guild.channels.cache.find(channel => channel.type === 'GUILD_TEXT');

  if (welcomeChannel) {
    welcomeChannel.send({ embeds: [welcomeEmbed] });
  } else {
    console.log('No text channels found in the guild.');
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'test') {
    await interaction.reply('test');
  } else if (interaction.commandName === 'embedtest') {
    const embed = new MessageEmbed()
      .setTitle('Embed Test')
      .setDescription('This is a test embed.')
      .setColor('#0099ff');

    await interaction.reply({ embeds: [embed] });
  } else if (interaction.commandName === 'ping') {
    const ping = client.ws.ping;
    await interaction.reply(`Bot latency is ${ping}ms.`);
  }
});

client.on('ready', async () => {
  try {
    const testData = {
      name: 'test',
      description: 'A test command'
    };

    const embedTestData = {
      name: 'embedtest',
      description: 'A command to test embeds'
    };

    const pingData = {
      name: 'ping',
      description: 'Check the bot\'s latency'
    };

    const commands = await client.application?.commands.fetch();
    console.log('Bot Commands:', commands);

    const testCommand = await client.application?.commands.create(testData);
    if (testCommand) {
      console.log(`Created command: ${testCommand.name}`);
    } else {
      console.log('Failed to create test command');
    }

    const embedTestCommand = await client.application?.commands.create(embedTestData);
    if (embedTestCommand) {
      console.log(`Created command: ${embedTestCommand.name}`);
    } else {
      console.log('Failed to create embedtest command');
    }

    const pingCommand = await client.application?.commands.create(pingData);
    if (pingCommand) {
      console.log(`Created command: ${pingCommand.name}`);
    } else {
      console.log('Failed to create ping command');
    }
  } catch (error) {
    console.error('Failed to create commands:', error);
  }
});

// your token here
client.login('');
