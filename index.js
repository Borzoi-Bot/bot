const { Client, Intents, MessageEmbed } = require('discord.js');
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
  ],
});

function getMuteRole(guild) {
  const muteRole = guild.roles.cache.find((role) => role.name === 'muted');
  return muteRole;
}

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
    } else if (commandName === 'mute') {
      await handleMuteCommand(interaction, guild);
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    await interaction.reply({
      content: 'An error occurred while processing the command.',
      ephemeral: true,
    });
  }
});

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
      content: 'Could not find a role named "muted" in the server.',
      ephemeral: true,
    });
  }

  const userRoles = targetMember.roles.cache.filter(role => role.id !== muteRole.id);

  try {
    await targetMember.roles.set([muteRole.id], reason);

    await targetMember.send(`You have been muted in ${guild.name} for ${duration} minutes. Reason: ${reason}`);
  } catch (error) {
    console.error('Failed to set roles or send DM to muted user:', error);
    return interaction.reply({
      content: 'An error occurred while muting the user.',
      ephemeral: true,
    });
  }

  setTimeout(async () => {
    await targetMember.roles.set(userRoles, 'Mute expired');
    try {
      await targetMember.send(`Your mute in ${guild.name} has expired. You are now unmuted.`);
    } catch (error) {
      console.error('Failed to send DM to unmuted user:', error);
    }

    await targetMember.roles.remove(muteRole, 'Mute expired');
  }, duration * 60 * 1000);

  await interaction.reply({
    content: `Successfully muted ${targetMember.user.tag} for ${duration} minutes. Reason: ${reason}`,
  });
}

// to read the config.json for the token
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const token = config.token;
client.login(token);
