/* eslint-disable */
const schema = require("./schema.json");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const axios = require("axios");
const { omit, cloneDeep, set } = require("lodash");
const example = require("./example.json");

function loadSchema(uri) {
  return axios.get(uri).then((res) => {
    return res.data;
  });
}
const ajv = new Ajv({ loadSchema: loadSchema, strictSchema: false });
addFormats(ajv);

let validator;

const initialData = {
  id: "EAG171622",
  issuedOn: "2018-08-01T00:00:00+08:00",
  name: "Edusave Award for Achievement, Good Leadership and Service (EAGLES) 2017",
  issuers: [
    {
      name: "Ministry of Education",
      did: "DID:SG-UEN:U18274928E",
      uen: "U18274928E",
      documentStore: "0xd9580260be45c3c0c2fb259a82f219b513054012",
      identityProof: {
        type: "DNS-TXT",
        location: "moe.gov.sg",
      },
    },
  ],
  recipient: { name: "John Doe" },
  award: { achievementDate: "2016-11-21" },
  signature: { name: "Vikram Nair" },
};

describe("certificate-of-awards/v2.0", () => {
  beforeAll(async () => {
    validator = await ajv.compileAsync(schema);
  });

  it("should be valid with minimum data", () => {
    expect(validator(initialData)).toBe(true);
  });

  it("should be valid with additional data", () => {
    const data = set(cloneDeep(initialData), "extraKey", "value");
    expect(validator(data)).toBe(true);
  });

  it("should be valid with the example", () => {
    expect(validator(example)).toBe(true);
  });

  describe("root required fields", () => {
    [
      "id",
      "recipient",
      "issuers",
      "issuedOn",
      "name",
      "award",
      "signature"
    ].forEach((field) => {
      it(`should fail when ${field} is missing`, () => {
        const data = omit(cloneDeep(initialData), field);
        expect(validator(data)).toBe(false);
        // Optionally, check for the correct error message
      });
    });
  });

  describe("issuers", () => {
    it("should fail when issuers is an empty array", () => {
      const data = set(cloneDeep(initialData), "issuers", []);
      expect(validator(data)).toBe(false);
    });
  });

  describe("recipient", () => {
    it("should fail when recipient.name is missing", () => {
      const data = omit(cloneDeep(initialData), "recipient.name");
      expect(validator(data)).toBe(false);
    });
  });

  describe("award", () => {
    it("should fail when both achievementYear and achievementDate are missing", () => {
      const data = omit(cloneDeep(initialData), [
        "award.achievementDate",
        "award.achievementYear",
      ]);
      expect(validator(data)).toBe(false);
    });
    it("should fail when achievementDate is not a valid date", () => {
      const data = set(cloneDeep(initialData), "award.achievementDate", "abc");
      expect(validator(data)).toBe(false);
    });
    it("should fail when achievementYear is not a valid year", () => {
      const data = set(cloneDeep(initialData), "award.achievementYear", "20X6");
      expect(validator(data)).toBe(false);
    });
  });

  describe("signature", () => {
    it("should fail when signature.name is missing", () => {
      const data = omit(cloneDeep(initialData), "signature.name");
      expect(validator(data)).toBe(false);
    });
  });
});
