const { Client, Intents, MessageEmbed } = require('discord.js');
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
  ],
});

client.once('ready', () => {
  console.log('Online');
});

client.on('guildCreate', (guild) => {
  console.log(`Joined new guild. Updated Guild ID: ${guild.id}`);

  const welcomeEmbed = new MessageEmbed()
    .setTitle('Thanks for adding Borzoi!')
    .setDescription('Thank you for adding Borzoi.')
    .setColor('#000000')
    .addField('Commands List:', '[UNUSED](https://example.com/link1)')
    .addField('GitHub:', '[GitHub](https://github.com/Borzoi-Bot)')
    .setImage('https://github.com/Borzoi-Bot/branding/blob/main/branding.png?raw=true');

  const welcomeChannel = guild.channels.cache.find(
    (channel) => channel.type === 'GUILD_TEXT'
  );

  if (welcomeChannel) {
    welcomeChannel.send({ embeds: [welcomeEmbed] });
  } else {
    console.log('No text channels found in the guild.');
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options, guild } = interaction;

  try {
    if (commandName === 'test') {
      await interaction.reply('test');
    } else if (commandName === 'embedtest') {
      const embed = new MessageEmbed()
        .setTitle('Embed Test')
        .setDescription('This is a test embed.')
        .setColor('#0099ff');

      await interaction.reply({ embeds: [embed] });
    } else if (commandName === 'ping') {
      const ping = client.ws.ping;
      await interaction.reply(`Bot latency is ${ping}ms.`);
    } else if (commandName === 'ban') {
      await handleBanCommand(interaction, guild);
    } else if (commandName === 'warn') {
      await handleWarnCommand(interaction, guild);
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    await interaction.reply({
      content: 'An error occurred while processing the command.',
      ephemeral: true,
    });
  }
});

client.on('ready', async () => {
  try {
    const testData = {
      name: 'test',
      description: 'A test command',
    };

    const embedTestData = {
      name: 'embedtest',
      description: 'A command to test embeds',
    };

    const pingData = {
      name: 'ping',
      description: 'Check the bot\'s latency',
    };

    const banData = {
      name: 'ban',
      description: 'Ban a user',
      options: [
        {
          name: 'user',
          description: 'The user to ban',
          type: 'USER',
          required: true,
        },
        {
          name: 'reason',
          description: 'Reason for the ban',
          type: 'STRING',
        },
      ],
    };

    const warnData = {
      name: 'warn',
      description: 'Warn a user',
      options: [
        {
          name: 'user',
          description: 'The user to warn',
          type: 'USER',
          required: true,
        },
        {
          name: 'reason',
          description: 'Reason for the warning',
          type: 'STRING',
        },
      ],
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

    const banCommand = await client.application?.commands.create(banData);
    if (banCommand) {
      console.log(`Created command: ${banCommand.name}`);
    } else {
      console.log('Failed to create ban command');
    }

    const warnCommand = await client.application?.commands.create(warnData);
    if (warnCommand) {
      console.log(`Created command: ${warnCommand.name}`);
    } else {
      console.log('Failed to create warn command');
    }
  } catch (error) {
    console.error('Failed to create commands:', error);
  }
});

async function handleBanCommand(interaction, guild) {
  const options = interaction.options;
  const reason = options.getString('reason') || 'No reason provided';
  const targetMember = options.getMember('user');

  // Check if the user has the "BAN_MEMBERS" permission
  if (!interaction.member.permissions.has('BAN_MEMBERS')) {
    return interaction.reply({
      content: 'You do not have permission to ban members.',
      ephemeral: true,
    });
  }

  if (!guild.me.permissions.has('BAN_MEMBERS')) {
    return interaction.reply({
      content: 'I do not have permission to ban members.',
      ephemeral: true,
    });
  }

  if (!targetMember) {
    return interaction.reply({
      content: 'Please specify a valid user to ban.',
      ephemeral: true,
    });
  }

  await targetMember.send(`You have been banned from ${guild.name} for: ${reason}`);

  await targetMember.ban({ reason });

  await interaction.reply({
    content: `Successfully banned ${targetMember.user.tag} for: ${reason}`,
  });
}

async function handleWarnCommand(interaction, guild) {
  const options = interaction.options;
  const reason = options.getString('reason') || 'No reason provided';
  const targetMember = options.getMember('user');

  if (!interaction.member.permissions.has('MANAGE_MESSAGES')) {
    return interaction.reply({
      content: 'You do not have permission to warn members.',
      ephemeral: true,
    });
  }

  if (!targetMember) {
    return interaction.reply({
      content: 'Please specify a valid user to warn.',
      ephemeral: true,
    });
  }

  await targetMember.send(`You have been warned in ${guild.name} for: ${reason}`);

  await interaction.reply({
    content: `Successfully warned ${targetMember.user.tag} for: ${reason}`,
  });

  console.log(`User ${targetMember.user.tag} warned in ${guild.name} for: ${reason}`);
}

// your token here
client.login('');
