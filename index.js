const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const express = require('express');
require('dotenv').config();

// 1. EXPRESS SERVER (To keep the bot online 24/7)
const app = express();
app.get('/', (req, res) => {
    res.send('Bot is 24/7 Online!');
});
app.listen(process.env.PORT || 3000, () => {
    console.log("Web server ready.");
});

// 2. DISCORD BOT SETUP
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

let isApplicationOpen = true; 

client.once('ready', () => {
    console.log(`Logged in as ${client.user.username}!`);
});

// Commands
client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;

    if (message.content === '!setup-app') {
        if (!message.member.permissions.has('Administrator')) return message.reply("You do not have permission to use this command.");

        const embed = new EmbedBuilder()
            .setTitle("📝 Staff Recruitment")
            .setDescription("If you want to become a staff member on our server, click the button below to fill out the application form.")
            .setColor("#0099ff");

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('apply_btn')
                .setLabel('Apply Now')
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }

    if (message.content === '!app-toggle') {
        if (!message.member.permissions.has('Administrator')) return message.reply("You do not have permission to use this command.");

        isApplicationOpen = !isApplicationOpen;
        const status = isApplicationOpen ? "🟢 OPEN" : "🔴 CLOSED";
        await message.reply(`Staff Applications are now **${status}**!`);
    }
});

// Interaction Handling (Buttons & Modals)
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'apply_btn') {
        if (!isApplicationOpen) {
            return await interaction.reply({ content: "Sorry! Staff applications are currently closed.", ephemeral: true });
        }

        const modal = new ModalBuilder().setCustomId('staff_modal').setTitle('Staff Application Form');

        // Original 3 Questions
        const ageInput = new TextInputBuilder().setCustomId('app_age').setLabel('What is your age?').setStyle(TextInputStyle.Short).setRequired(true);
        const reasonInput = new TextInputBuilder().setCustomId('app_reason').setLabel('Why should we accept you as staff?').setStyle(TextInputStyle.Paragraph).setRequired(true);
        const experienceInput = new TextInputBuilder().setCustomId('app_exp').setLabel('Do you have any previous experience?').setStyle(TextInputStyle.Paragraph).setRequired(false);
        
        // 2 New Advance Questions (Maxing out the Discord Modal limit to 5)
        const activityInput = new TextInputBuilder().setCustomId('app_activity').setLabel('How many hours can you dedicate daily?').setStyle(TextInputStyle.Short).setRequired(true);
        const scenarioInput = new TextInputBuilder().setCustomId('app_scenario').setLabel('How do you handle toxic players or hackers?').setStyle(TextInputStyle.Paragraph).setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(ageInput),
            new ActionRowBuilder().addComponents(reasonInput),
            new ActionRowBuilder().addComponents(experienceInput),
            new ActionRowBuilder().addComponents(activityInput),
            new ActionRowBuilder().addComponents(scenarioInput)
        );
        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'staff_modal') {
        const age = interaction.fields.getTextInputValue('app_age');
        const reason = interaction.fields.getTextInputValue('app_reason');
        const exp = interaction.fields.getTextInputValue('app_exp') || "None";
        const activity = interaction.fields.getTextInputValue('app_activity');
        const scenario = interaction.fields.getTextInputValue('app_scenario');

        const logChannel = client.channels.cache.get(process.env.APPLICATION_CHANNEL_ID);

        const appEmbed = new EmbedBuilder()
            .setTitle("New Staff Application Submitted!")
            .setColor("#32a852")
            .addFields(
                { name: 'Applicant', value: `${interaction.user.username} (${interaction.user.id})`, inline: true },
                { name: 'Age', value: age, inline: true },
                { name: 'Daily Activity', value: activity, inline: true },
                { name: 'Reason to Join', value: reason },
                { name: 'Previous Experience', value: exp },
                { name: 'Handling Toxicity/Hackers', value: scenario }
            )
            .setTimestamp();

        // Remaining 8 Advance Questions that will be sent to the logs for Phase-2 interview
        const remainingQuestionsEmbed = new EmbedBuilder()
            .setTitle("📝 Phase 2: Interview Questions for Applicant")
            .setColor("#e74c3c")
            .setDescription(`Ask these remaining advanced questions to ${interaction.user.username} in DM/Interview channel:\n\n` +
                "**1.** What specific skills or qualities can you bring to our staff team?\n" +
                "**2.** If a higher staff member is abusing their power, what will you do?\n" +
                "**3.** Are you currently staff on any other Discord or Minecraft server?\n" +
                "**4.** What is your timezone and what hours are you most active?\n" +
                "**5.** How do you handle stressful situations or heavy arguments in chat?\n" +
                "**6.** Do you have basic knowledge of server plugin commands (like Essentials, AdvancedBan)?\n" +
                "**7.** Why do you want to join our server specifically instead of others?\n" +
                "**8.** If an active player breaks a minor rule, would you warn or instantly ban them?");

        if (logChannel) {
            await logChannel.send({ embeds: [appEmbed] });
            await logChannel.send({ embeds: [remainingQuestionsEmbed] });
            await interaction.reply({ content: "Your application Phase-1 has been successfully submitted! Admin team will review it soon.", ephemeral: true });
        } else {
            await interaction.reply({ content: "Error: Application log channel not found.", ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
