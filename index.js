const { Client, Intents, MessageEmbed } = require('discord.js');
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
  ],
});

const cooldowns = new Map();

function getMuteRole(guild) {
  return guild.roles.cache.find((role) => role.name === 'muted');
}

function setMute(callback, delay) {
  setTimeout(callback, delay);
}

const helpCommand = {
  name: 'help',
  description: 'Get a list of all commands and their functions',
};


async function setupCommands() {
  const existingCommands = await client.application?.commands.fetch();

  const commandsToRegister = [
    helpCommand,
    { name: 'test', description: 'A test command' },
    { name: 'embedtest', description: 'A command to test embeds' },
    { name: 'ping', description: 'Check the bot\'s latency' },
    {
      name: 'ban',
      description: 'Ban a user',
      options: [
        { name: 'user', description: 'The user to ban', type: 'USER', required: true },
        { name: 'reason', description: 'Reason for the ban', type: 'STRING' },
      ],
    },
    {
      name: 'warn',
      description: 'Warn a user',
      options: [
        { name: 'user', description: 'The user to warn', type: 'USER', required: true },
        { name: 'reason', description: 'Reason for the warning', type: 'STRING' },
      ],
    },
    {
      name: 'mute',
      description: 'Mute a user',
      options: [
        { name: 'user', description: 'The user to mute', type: 'USER', required: true },
        { name: 'duration', description: 'Duration of the mute in minutes', type: 'INTEGER', required: true },
        { name: 'reason', description: 'Reason for the mute', type: 'STRING' },
      ],
    },
    {
      name: 'kick',
      description: 'Kick a user',
      options: [
        { name: 'user', description: 'The user to kick', type: 'USER', required: true },
        { name: 'reason', description: 'Reason for the kick', type: 'STRING' },
      ],
    },
    {
      name: 'version',
      description: 'Get bot version information',
    },
  ];

  for (const command of commandsToRegister) {
    const existingCommand = existingCommands.find(cmd => cmd.name === command.name);

    if (existingCommand) {
      await client.application?.commands.edit(existingCommand.id, command);
      console.log(`Updated command: ${existingCommand.name}`);
    } else {
      await client.application?.commands.create(command);
      console.log(`Created command: ${command.name}`);
    }
  }
}

client.once('ready', () => {
  console.log('Online');
  setupCommands();
});

client.on('guildCreate', (guild) => {
  const welcomeEmbed = new MessageEmbed()
    .setTitle('Thanks for adding Borzoi!')
    .setDescription('Thank you for adding Borzoi, here are some links if you need them.')
    .setColor('#000000')
    .addField('Wiki:', '[GitHub Wiki](https://github.com/Borzoi-Bot/bot/wiki/Overview)')
    .addField('GitHub:', '[GitHub](https://github.com/Borzoi-Bot)')
    .addField('Support Server:', '[Discord](https://discord.gg/ZvCqsYTndn)')
    .setImage('https://github.com/Borzoi-Bot/branding/blob/main/branding.png?raw=true');

  const welcomeChannel = guild.channels.cache.find((channel) => channel.type === 'GUILD_TEXT');

  if (welcomeChannel) {
    welcomeChannel.send({ embeds: [welcomeEmbed] });
  } else {
    console.log('No text channels found in the guild.');
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand() || interaction.replied || interaction.deferred) {
    return;
  }

  const { commandName, guild } = interaction;

  try {
    const user = interaction.user;
    if (!checkCooldown(user, commandName)) {
      return interaction.reply({
        content: 'Command on cooldown. Please wait',
        ephemeral: true,
      });
    }

    if (!interaction) {
      console.error('Interaction object is undefined.');
      return;
    }
    
    const userId = user.id;

    if (checkBlacklist(userId)) {
      return interaction.reply({
        content: 'You have been blacklisted from Borzoi.',
        ephemeral: true,
      });
    }

    switch (commandName) {
      case 'test':
        await interaction.reply('test');
        break;
      case 'embedtest':
        const embed = new MessageEmbed()
          .setTitle('Embed Test')
          .setDescription('This is a test embed.')
          .setColor('#0099ff');
        await interaction.reply({ embeds: [embed] });
        break;
      case 'ping':
        const ping = client.ws.ping;
        await interaction.reply(`Bot latency is ${ping}ms.`);
        break;
      case 'ban':
        await handleBanCommand(interaction, guild);
        break;
      case 'warn':
        await handleWarnCommand(interaction, guild);
        break;
      case 'mute':
        await handleMuteCommand(interaction, guild);
        break;
      case 'kick':
        await handleKickCommand(interaction, guild);
        break;
      case 'version':
        await handleVersionCommand(interaction);
        break;
      case 'help':
        await handleHelpCommand(interaction);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    await interaction.reply({
      content: 'An error occurred while processing the command.',
      ephemeral: true,
    });
  }
});


async function handleHelpCommand(interaction) {
  const commands = [
    { name: 'test', description: 'A test command' },
    { name: 'embedtest', description: 'A command to test embeds' },
    { name: 'ping', description: 'Check the bot\'s latency' },
    { name: 'ban', description: 'Ban a user' },
    { name: 'warn', description: 'Warn a user' },
    { name: 'mute', description: 'Mute a user' },
    { name: 'kick', description: 'Kick a user' },
    { name: 'version', description: 'Get bot version information' },
    { name: 'help', description: 'Get a list of all commands and their functions' },
  ];


  const embed = new MessageEmbed()
    .setTitle('Commands')
    .setDescription('Here is a list of all available commands and their functions:')
    .setColor('#00000');

  commands.forEach(command => {
    embed.addField(`/${command.name}`, command.description);
  });

  embed.addField('Support Server', '[Discord](https://discord.gg/ZvCqsYTndn)');
  embed.addField('GitHub Organization', '[GitHub](https://github.com/Borzoi-Bot)')

  await interaction.reply({ embeds: [embed] });
}

async function handleBanCommand(interaction, guild) {
  const options = interaction.options;
  const reason = options.getString('reason') || 'No reason provided';
  const targetMember = options.getMember('user');

  if (!interaction.member.permissions.has('BAN_MEMBERS')) {
    return interaction.reply({
      content: 'You do not have permission to ban members.',
      ephemeral: true,
    });
  }

  if (targetMember.roles.highest.position >= guild.me.roles.highest.position) {
    return interaction.reply({
      content: 'I cannot ban a member with equal or higher roles than me.',
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
  

  const dmResult = await sendDM(targetMember, `You have been banned from ${guild.name} for: ${reason}`);

  await targetMember.ban({ reason });

  if (!dmResult) {
    return interaction.reply({
      content: `I could not DM ${targetMember.user.tag}, but I banned them anyway.`,
    });
  }

  await interaction.reply({
    content: `Successfully banned ${targetMember.user.tag} for: ${reason}`,
  });
}

async function handleWarnCommand(interaction, guild) {
  try {
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

    const dmResult = await sendDM(targetMember, `You have been warned in ${guild.name} for: ${reason}`);

    await interaction.reply({
      content: `Successfully warned ${targetMember.user.tag} for: ${reason}`,
    });

    if (!dmResult) {
      return interaction.followUp({
        content: `I could not DM ${targetMember.user.tag}, but I warned them anyway.`,
      });
    }
  } catch (error) {
    console.error('Error handling warn command:', error);
    await interaction.followUp({
      content: 'An error occurred while processing the command.',
      ephemeral: true,
    });
  }
}

async function handleMuteCommand(interaction, guild) {
  const options = interaction.options;
  const duration = options.getInteger('duration');
  const reason = options.getString('reason') || 'No reason provided';
  const targetMember = options.getMember('user');

  if (!interaction.member.permissions.has('MANAGE_ROLES')) {
    return interaction.reply({
      content: 'You do not have permission to mute members.',
      ephemeral: true,
    });
  }

  if (!guild.me.permissions.has('MANAGE_ROLES')) {
    return interaction.reply({
      content: 'I do not have permission to manage roles.',
      ephemeral: true,
    });
  }

  if (!targetMember) {
    return interaction.reply({
      content: 'Please specify a valid user to mute.',
      ephemeral: true,
    });
  }

  const muteRole = getMuteRole(guild);

  if (!muteRole) {
    return interaction.reply({
      content: 'Could not find a role named "muted" in the server. Please create a muted role first.',
      ephemeral: true,
    });
  }

  const userRoles = targetMember.roles.cache.filter(role => role.id !== muteRole.id);

  const dmResult = await sendDM(targetMember, `You have been muted in ${guild.name} for ${duration} minutes. Reason: ${reason}`);

  try {
    await targetMember.roles.set([muteRole.id], reason);
  } catch (error) {
    console.error('Failed to set roles or send DM to muted user:', error);
    return interaction.reply({
      content: 'An error occurred while muting the user.',
      ephemeral: true,
    });
  }

  if (targetMember.roles.highest.position >= guild.me.roles.highest.position) {
    return interaction.reply({
      content: 'I cannot mute a member with equal or higher roles than me.',
      ephemeral: true,
    });
  }


  setMute(async () => {
    await targetMember.roles.set(userRoles, 'Mute expired');
    try {
      await sendDM(targetMember, `Your mute in ${guild.name} has expired. You are now unmuted.`);
    } catch (error) {
      console.error('Failed to send DM to unmuted user:', error);
    }

    await targetMember.roles.remove(muteRole, 'Mute expired');
  }, duration * 60 * 1000);

  if (!dmResult) {
    return interaction.reply({
      content: `I could not DM ${targetMember.user.tag}, but I muted them anyway.`,
      ephemeral: true,
    });
  }

  await interaction.reply({
    content: `Successfully muted ${targetMember.user.tag} for ${duration} minutes. Reason: ${reason}`,
  });
}

async function handleKickCommand(interaction, guild) {
  const options = interaction.options;
  const reason = options.getString('reason') || 'No reason provided';
  const targetMember = options.getMember('user');

  if (!interaction.member.permissions.has('KICK_MEMBERS')) {
    return interaction.reply({
      content: 'You do not have permission to kick members.',
      ephemeral: true,
    });
  }

  if (targetMember.roles.highest.position >= guild.me.roles.highest.position) {
    return interaction.reply({
      content: 'I cannot kick a member with equal or higher roles than me.',
      ephemeral: true,
    });
  }

  if (!guild.me.permissions.has('KICK_MEMBERS')) {
    return interaction.reply({
      content: 'I do not have permission to kick members.',
      ephemeral: true,
    });
  }

  if (!targetMember) {
    return interaction.reply({
      content: 'Please specify a valid user to kick.',
      ephemeral: true,
    });
  }

  const dmResult = await sendDM(targetMember, `You have been kicked from ${guild.name} for: ${reason}`);

  await targetMember.kick(reason);

  if (!dmResult) {
    return interaction.reply({
      content: `I could not DM ${targetMember.user.tag}, but I kicked them anyway.`,
    });
  }

  await interaction.reply({
    content: `Successfully kicked ${targetMember.user.tag} for: ${reason}`,
  });
}

async function sendDM(user, message) {
  try {
    await user.send(message);
    return true;
  } catch (error) {
    return false;
  }
}

async function handleVersionCommand(interaction) {
  // please make sure to update this info whenever there's a new pull request for the production branch
  const versionInfo = {
    version: '1.0.1', 
    releaseDate: 'December 21st, 2023', 
    changes: [
      '- urgent bug fixes',
      '- command cooldown'
    ],
  };

  const embed = new MessageEmbed()
    .setTitle('Bot Version Information')
    .setDescription(`Current version: ${versionInfo.version}`)
    .addField('Release Date', versionInfo.releaseDate)
    .addField('Changes:', versionInfo.changes.join('\n'))
    .setColor('#000000')

  await interaction.reply({ embeds: [embed] });
}


function checkBlacklist(userId) {
  const blacklist = ['664656179846184970', '1137140543407788033', '878769187370176523'];
  return blacklist.includes(userId);
}

function checkCooldown(userId, command) {
  const now = Date.now();
  const userCooldowns = cooldowns.get(userId) || {};
  const commandCooldown = userCooldowns[command] || 0;

  if (commandCooldown > now) {
    return false;
  }

  userCooldowns[command] = now + 10000;
  cooldowns.set(userId, userCooldowns);

  return true;
}


// to read the config.json for the token
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const token = config.token;
client.login(token);
