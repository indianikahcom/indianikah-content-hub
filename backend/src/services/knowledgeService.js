const repository = require("../repositories/knowledgeRepository");
const AppError = require("../errors/AppError");
const transitions = {
  DRAFT: ["PENDING_APPROVAL"],
  PENDING_APPROVAL: ["APPROVED", "DRAFT", "REJECTED"],
  APPROVED: ["DRAFT", "ARCHIVED"],
  REJECTED: ["DRAFT"],
  ARCHIVED: ["DRAFT"],
};

const get = async (id) => {
  const item = await repository.findById(id);
  if (!item) throw new AppError("Knowledge item not found", 404);
  return item;
};

const ensureUnique = async (data) => {
  const duplicate = await repository.findDuplicate(data);
  if (duplicate) {
    throw new AppError(
      "A knowledge item with the same type, title and language already exists",
      409
    );
  }
};

const create = async (payload) => {
  await ensureUnique(payload);
  return repository.create(payload);
};

const list = (filters) => repository.list(filters);

const update = async (id, payload) => {
  const current = await get(id);
  if (current.status === "APPROVED" && payload.content !== undefined) {
    throw new AppError(
      "Move an approved item back to DRAFT before editing its content",
      409
    );
  }

  await ensureUnique({
    id,
    type: payload.type ?? current.type,
    title: payload.title ?? current.title,
    language: payload.language ?? current.language,
  });

  return repository.update(id, payload);
};

const changeStatus = async (id, nextStatus) => {
  const current = await get(id);
  if (current.status === nextStatus) return current;

  if (!(transitions[current.status] || []).includes(nextStatus)) {
    throw new AppError(
      `Invalid knowledge status transition: ${current.status} -> ${nextStatus}`,
      409
    );
  }

  return repository.update(id, { status: nextStatus });
};

const remove = async (id) => {
  const current = await get(id);
  if (current.status === "APPROVED") {
    throw new AppError("Approved items must be archived instead of deleted", 409);
  }
  await repository.remove(id);
  return { id: Number(id), deleted: true };
};

module.exports = { create, list, get, update, changeStatus, remove };
