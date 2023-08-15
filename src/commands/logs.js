const { PermissionFlagsBits, ActionRowBuilder, ChannelSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  slash: true, 
  enable: true,
  dbl: true, 
  name: 'logayarla',  
  description: 'Log kanallarını ayarlamak için bir form gönderir.',
  async run(client, interaction, db) {
    if(interaction.member.id !== interaction.guild.ownerId) return interaction.reply("Bu komudu sadece sunucu sahibi kullanabilir.");
    await interaction.deferReply();

    const selectMenu = new ActionRowBuilder()
      .addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId("covid19code")
          .setPlaceholder("Kanal seçiniz.")
          .setChannelTypes("GuildText")
      );

    let page = 0;

    
    const texts = [
      { text: "kanal oluşturulduğunda", event: "ChannelCreate" },
      { text: "kanal silindiğinde", event: "ChannelDelete" },
      { text: "kanal düzenlendiğinde", event: "ChannelUpdate" },
      { text: "kanalın izinleri düzenlendiğinde", event: "ChannelOverwriteUpdate" },
      { text: "rol oluşturulduğunda", event: "RoleCreate" },
      { text: "rol silindiğinde", event: "RoleDelete" },
      { text: "rol düzenlendiğinde", event: "RoleUpdate" },
      { text: "emoji oluşturulduğunda", event: "EmojiCreate" },
      { text: "emoji silindiğinde", event: "EmojiDelete" },
      { text: "emoji düzenlendiğinde", event: "EmojiUpdate" },
      { text: "webhook oluşturulduğunda", event: "WebhookCreate" },
      { text: "webhook silindiğinde", event: "WebhookDelete" },
      { text: "webhook düzenlendiğinde", event: "WebhookUpdate" },
      { text: "üye banlandığında", event: "MemberBanAdd" },
      { text: "üyenini banı açıldığında", event: "MemberBanRemove" },
      { text: "üyeler toplu atıldığında (prune)", event: "MemberPrune" },
      { text: "üye atıldığında", event: "MemberKick" },
      { text: "üyenin rolleri düzenlendiğinde", event: "MemberRoleUpdate" },
      { text: "üye düzenlendiğinde", event: "MemberUpdate" },
      { text: "bot eklendiğinde", event: "BotAdd" },
      { text: "mesaj silindiğinde", event: "MessageDelete", guard: false },
      { text: "mesaj düzenlendiğinde", event: "MessageUpdate", guard: false },
    ]

    let settings = texts.map(x => db.has(`guards_${interaction.guild.id}.${x.event}`));
    let rules = texts.map(x => db.get(`rule_${interaction.guild.id}.${x.event}`) ?? "Nothing");

    let embed = new EmbedBuilder()
      .setTitle("zLyqen Bot Log Ayarları")
      .setDescription(`Bir **${texts[0].text}** bildirilecek kanalı seçiniz.\nButonları kullanarak log/koruma sistemini açın ya da kapatın.\nDiğer sistemleri görmek için \`<\` \`>\` butonlarını kullanın.\n\nBu sistem için ayarlanan log kanalı: ${db.has(`logs_${interaction.guild.id}.${texts[0].event}`) ? "<#"+db.get(`logs_${interaction.guild.id}.${texts[0].event}`)+">" : "Yok."}`)
      .setFooter({ text: "1/"+texts.length, iconURL: interaction.guild.iconURL() });

    // Sayfa Sistemi İleri-Geri
    const row3 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('back')
          .setLabel('<')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('forward')
          .setLabel('>')
          .setStyle(ButtonStyle.Success),
      );

    const message = await interaction.editReply({ embeds: [embed], components: [
      selectMenu,
      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('RolesRemove')
            .setLabel('Tüm Rollerini Al')
            .setStyle(rules[0]==="RolesRemove"?ButtonStyle.Success:ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('Kick')
            .setLabel('At')
            .setStyle(rules[0]==="Kick"?ButtonStyle.Success:ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('Ban')
            .setLabel('Yasakla')
            .setStyle(rules[0]==="Ban"?ButtonStyle.Success:ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('Nothing')
            .setLabel('Ceza Verme')
            .setStyle(rules[0]==="Nothing"?ButtonStyle.Success:ButtonStyle.Secondary),
        ),
      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('logClose')
            .setLabel('Logu Kapat')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('guardClose')
            .setLabel(`Koruma Sistemini ${settings[0]?"Kapat":"Aç"}`)
            .setStyle(settings[0]?ButtonStyle.Danger:ButtonStyle.Success),
        ),
      row3] });
    
    const filter = i => i.user.id === interaction.user.id;
    const collector = message.createMessageComponentCollector({ filter, time: 1000*60*10 }); //  Süre 10dk değiştirebilirsiniz.

    collector.on('collect', async i => {
      if(["back", "forward"].includes(i.customId)) {
        // Sayfa Sistemi
        if(i.customId === "back") {
            page = page-1;
            if(page === -1) page = texts.length-1;
        } else { 
            page = page+1;
            if(page === texts.length) page = 0;
        };
        await updateMessage(i);
      } else if(i.customId === "logClose") {
        db.set(`logs_${interaction.guild.id}.${texts[page].event}`, undefined);
        i.reply({ content: "Log kanalı sıfırlandı.", ephemeral: true });
      } else if(i.customId === "guardClose") {
        settings[page] = false;
        db.set(`guards_${interaction.guild.id}.${texts[page].event}`, false);
        await updateMessage(i);
      } else if(i.customId === "guardOpen") {
        settings[page] = true;
        db.set(`guards_${interaction.guild.id}.${texts[page].event}`, true);
        await updateMessage(i);
      } else if(["RolesRemove", "Kick", "Ban", "Nothing"].includes(i.customId)) { // Ceza
        rules[page] = i.customId;
        db.set(`rule_${interaction.guild.id}.${texts[page].event}`, i.customId);
        await updateMessage(i);
      } else { // Select Menu
        db.set(`logs_${interaction.guild.id}.${texts[page].event}`, i.channels.at(0).id);
        await updateMessage(i);
      }
    });

    collector.on('end', () => interaction.deleteReply()); // 10dk sonra mesajı siler.

    async function updateMessage(i) { // i.update için kullanılır.
      let components = [selectMenu];
      if(texts[page].guard !== false) {
        components.push(new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('RolesRemove')
              .setLabel('Tüm Rollerini Al')
              .setStyle(rules[page]==="RolesRemove"?ButtonStyle.Success:ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('Kick')
              .setLabel('At')
              .setStyle(rules[page]==="Kick"?ButtonStyle.Success:ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('Ban')
              .setLabel('Yasakla')
              .setStyle(rules[page]==="Ban"?ButtonStyle.Success:ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('Nothing')
              .setLabel('Ceza Verme')
              .setStyle(rules[page]==="Nothing"?ButtonStyle.Success:ButtonStyle.Secondary),
          ),
        new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('logClose')
              .setLabel('Logu Kapat')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId(settings[page]?'guardClose':'guardOpen')
              .setLabel(`Koruma Sistemini ${settings[page]?"Kapat":"Aç"}`)
              .setStyle(settings[page]?ButtonStyle.Danger:ButtonStyle.Success),
          ),
          row3
        );
      } else {
        components.push(
        new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('logClose')
              .setLabel('Logu Kapat')
              .setStyle(ButtonStyle.Danger),
          ),
          row3
        );
      };
      await i.update({ embeds: [
          embed
          .setDescription(`Bir **${texts[page].text}** mesaj atılacak kanalı seçiniz.\nButonları kullanarak log/koruma sistemini açın ya da kapatın.\nKural ihlali sonucunda üyeye yapılacak işlemi seçiniz.\nDiğer sistemleri görmek için \`<\` \`>\` butonlarını kullanın.\n\nBu sistem için ayarlanan log kanalı: ${db.has(`logs_${interaction.guild.id}.${texts[page].event}`) ? "<#"+db.get(`logs_${interaction.guild.id}.${texts[page].event}`)+">" : "Yok."}`)
          .setFooter({ text: `${page+1}/${texts.length}`, iconURL: interaction.guild.iconURL() })
        ],
        components
      });
    }
  },
};

