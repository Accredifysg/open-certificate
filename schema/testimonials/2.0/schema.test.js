/* eslint-disable */
const schema = require("./schema.json");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const axios = require("axios");
const { omit, cloneDeep, set } = require("lodash");
const example = require("./example.json");
let {
  issueDocument,
  addSchema,
  validateSchema
} = require("@govtechsg/open-attestation");

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
  schema: "certificate-of-awards/1.0",
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

describe("testimonials/v2.0", () => {
  beforeEach(() => {
    addSchema(schema);
  });

  afterEach(() => {
    delete require.cache[require.resolve("@govtechsg/open-attestation")];
    let {
      issueDocument,
      addSchema,
      validateSchema
    } = require("@govtechsg/open-attestation");
  });

  const minimalValid = {
    id: "testimonial-ynps2017-nric000G1002",
    name: "School Graduation Certificate Testimonial",
    issuedOn: "2018-08-01T00:00:00+08:00",
    issuers: [
      {
        name: "Issuer Name",
        documentStore: "0x0000000000000000000000000000000000000000",
        identityProof: {
          type: "DNS-TXT",
          location: "example.com"
        }
      }
    ],
    recipient: {
      name: "John Doe"
    },
    testimonial: {
      role: "chairman",
      instituteName: "ABC Junior College",
      achievementArea: "No Idea",
      achievementYear: "2016"
    },
    referee: {
      name: "Mrs Jane Doe",
      designation: "Director-General of Education Singapore",
      relationship: "teacher"
    }
  };

  it("is valid with minimal data", () => {
    const signedDocument = issueDocument(minimalValid, schema);
    const valid = validateSchema(signedDocument);
    expect(valid).toBeTruthy();
  });

  it("is not valid with missing data", () => {
    const data = {};
    const signing = () => issueDocument(data, schema);
    expect(signing).toThrow("Invalid document");
  });

  it("is not valid with additional data", () => {
    const data = { ...minimalValid, invalidKey: "value" };
    const signing = () => issueDocument(data, schema);
    expect(signing).toThrow("Invalid document");
  });

  it("is not valid with empty issuer array", () => {
    const data = { ...minimalValid, issuers: [] };
    const signing = () => issueDocument(data, schema);
    expect(signing).toThrow("Invalid document");
  });

  it("is not valid when testimonial is missing", () => {
    const data = { ...minimalValid };
    delete data.testimonial;
    const signing = () => issueDocument(data, schema);
    expect(signing).toThrow("Invalid document");
  });

  it("is not valid when referee is missing", () => {
    const data = { ...minimalValid };
    delete data.referee;
    const signing = () => issueDocument(data, schema);
    expect(signing).toThrow("Invalid document");
  });

  it("is not valid when required testimonial fields are missing", () => {
    const data = { ...minimalValid, testimonial: {} };
    const signing = () => issueDocument(data, schema);
    expect(signing).toThrow("Invalid document");
  });

  it("should fail when both achievementYear and achievementDate are missing in testimonial", () => {
    const data = JSON.parse(JSON.stringify(minimalValid));
    delete data.testimonial.achievementYear;
    delete data.testimonial.achievementDate;
    const signing = () => issueDocument(data, schema);
    expect(signing).toThrow("Invalid document");
  });

  it("should fail when achievementDate is not a valid date", () => {
    const data = JSON.parse(JSON.stringify(minimalValid));
    data.testimonial.achievementDate = "not-a-date";
    const signing = () => issueDocument(data, schema);
    expect(signing).toThrow("Invalid document");
  });

  it("should fail when achievementYear is not a valid year", () => {
    const data = JSON.parse(JSON.stringify(minimalValid));
    data.testimonial.achievementYear = "20X6";
    const signing = () => issueDocument(data, schema);
    expect(signing).toThrow("Invalid document");
  });

  it("should fail when referee.name is missing", () => {
    const data = JSON.parse(JSON.stringify(minimalValid));
    delete data.referee.name;
    const signing = () => issueDocument(data, schema);
    expect(signing).toThrow("Invalid document");
  });

  it("is valid with additional properties in issuer", () => {
    const data = JSON.parse(JSON.stringify(minimalValid));
    data.issuers[0].extraIssuerProp = true;
    const signedDocument = issueDocument(data, schema);
    const valid = validateSchema(signedDocument);
    expect(valid).toBeTruthy();
  });

  it("is valid with additional properties in recipient", () => {
    const data = JSON.parse(JSON.stringify(minimalValid));
    data.recipient.extraRecipientProp = true;
    const signedDocument = issueDocument(data, schema);
    const valid = validateSchema(signedDocument);
    expect(valid).toBeTruthy();
  });

  it("is valid with $template present", () => {
    const data = JSON.parse(JSON.stringify(minimalValid));
    data.$template = {
      name: "CUSTOM_TEMPLATE",
      type: "EMBEDDED_RENDERER",
      url: "https://demo-renderer.opencerts.io"
    };
    const signedDocument = issueDocument(data, schema);
    const valid = validateSchema(signedDocument);
    expect(valid).toBeTruthy();
  });

  it("should fail with empty $template", () => {
    const data = JSON.parse(JSON.stringify(minimalValid));
    data.$template = {};
    expect(() => issueDocument(data, schema)).toThrow("Invalid document");
  });

  // Add more tests as needed for other custom or inherited properties
});
