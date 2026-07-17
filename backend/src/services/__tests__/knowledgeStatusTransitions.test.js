const { TRANSITIONS } = require("../knowledgeService");

describe("Knowledge status transitions", () => {
  test("draft can be submitted", () => {
    expect(TRANSITIONS.DRAFT).toContain("PENDING_APPROVAL");
  });

  test("pending item can be approved or rejected", () => {
    expect(TRANSITIONS.PENDING_APPROVAL).toContain("APPROVED");
    expect(TRANSITIONS.PENDING_APPROVAL).toContain("REJECTED");
  });

  test("approved item cannot move directly to rejected", () => {
    expect(TRANSITIONS.APPROVED).not.toContain("REJECTED");
  });

  test("archived item can be restored only to draft", () => {
    expect(TRANSITIONS.ARCHIVED).toEqual(["DRAFT"]);
  });
});
