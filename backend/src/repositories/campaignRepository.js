const prisma = require("../database/prisma");

const create = (postId, platforms) => prisma.publishCampaign.create({
  data: {
    postId,
    status: "RUNNING",
    startedAt: new Date(),
    publications: { create: platforms.map(platform => ({ platform, status: "PENDING" })) }
  },
  include: { publications: true }
});

const findById = id => prisma.publishCampaign.findUnique({
  where: { id: Number(id) },
  include: {
    post: { include: { variants: true, source: true } },
    publications: { orderBy: { platform: "asc" } }
  }
});

const updatePublication = (id, data) =>
  prisma.campaignPublication.update({ where: { id: Number(id) }, data });

const update = (id, data) => prisma.publishCampaign.update({
  where: { id: Number(id) },
  data,
  include: { publications: { orderBy: { platform: "asc" } } }
});

const listByPostId = postId => prisma.publishCampaign.findMany({
  where: { postId: Number(postId) },
  include: { publications: { orderBy: { platform: "asc" } } },
  orderBy: { createdAt: "desc" }
});

module.exports = { create, findById, updatePublication, update, listByPostId };
