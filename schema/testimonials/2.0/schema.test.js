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
  id: "Example-minimal-2018-001",
  name: "Certificate Name",
  issuedOn: "2018-08-01T00:00:00+08:00",
  recipient: {
    name: "Recipient Name",
  },
  testimonial: { achievementYear: "2016" },
  referee: { name: "Jon Referee" },
  issuers: [
    {
      name: "Issuer Name",
      did: "DID:SG-UEN:U18274928E",
      uen: "U18274928E",
      documentStore: "0x0000000000000000000000000000000000000000",
      identityProof: {
        type: "DNS-TXT",
        location: "example.com",
      },
    },
  ],
};

describe("testimonials/v2.0", () => {
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
      "testimonial",
      "referee"
    ].forEach((field) => {
      it(`should fail when ${field} is missing`, () => {
        const data = omit(cloneDeep(initialData), field);
        expect(validator(data)).toBe(false);
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

  describe("testimonial", () => {
    it("should fail when both achievementYear and achievementDate are missing", () => {
      const data = omit(cloneDeep(initialData), [
        "testimonial.achievementDate",
        "testimonial.achievementYear",
      ]);
      expect(validator(data)).toBe(false);
    });
    it("should fail when achievementDate is not a valid date", () => {
      const data = set(cloneDeep(initialData), "testimonial.achievementDate", "abc");
      expect(validator(data)).toBe(false);
    });
    it("should fail when achievementYear is not a valid year", () => {
      const data = set(cloneDeep(initialData), "testimonial.achievementYear", "20X6");
      expect(validator(data)).toBe(false);
    });
  });

  describe("referee", () => {
    it("should fail when referee.name is missing", () => {
      const data = omit(cloneDeep(initialData), "referee.name");
      expect(validator(data)).toBe(false);
    });
  });
});
