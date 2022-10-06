const { Expo } = require('expo-server-sdk');
const express = require('express');

let expo = new Expo();

const server = express();

server.post('/notification/:token', async (req, res) => {
  const { params } = req;
  console.log("🚀 params?.token", params?.token)
  const messages = [
    {
      to: params?.token,
      title: "Nova mensagem Title",
      subtitle: "Nova mensagem Subtitle",
      body: "Nova mensagem Body",
      data: {
        withSome: "data",
      },
    },
  ];

  if (Expo.isExpoPushToken(params?.token)) {
    const chunks = expo.chunkPushNotifications(messages);
    console.log("🚀 chunks", chunks);
    const tickets = [];
    const receiptIds = [];

    await (async () => {
      for (let chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
          console.log("🚀 ticketChunk", ticketChunk);
        } catch (error) {
          console.log("🚀 ticketChunk error", error);
        }
      }
    })();

    for (let ticket of tickets) {
      if (ticket.id) receiptIds.push(ticket.id);
    }

    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
    console.log("🚀 receiptIdChunks", receiptIdChunks);

    await (async () => {
      for (let chunk of receiptIdChunks) {
        try {
          const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
          console.log("🚀 receipts", receipts)

          for (let receiptId in receipts) {
            const { status, message, details } = receipts[receiptId];

            if (status === "ok") {
              console.error(`🚀 Send notification is good`);
            } else if (status === "error") {
              console.error(
                `🚀 There was an error sending a notification: ${message}`
              );

              if (details && details.error) {
                console.error(`🚀 The error code is ${details.error}`);
              }
            }
          }
        } catch (error) {
          console.log("🚀 receiptIdChunks error", error);
        }
      }
    })();
  }

  return res.json({ data: `Token expo: ${req?.params?.token}` });
});

server.listen(4000);
