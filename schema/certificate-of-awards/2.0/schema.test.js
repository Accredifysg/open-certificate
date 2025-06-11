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

describe("certificate-of-awards/v2.0", () => {
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
    id: "EAG171622",
    name: "Edusave Award for Achievement, Good Leadership and Service (EAGLES) 2017",
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
    award: {
      instituteName: "ABC Junior College",
      achievementArea: "Runner Up for ABC Competition",
      achievementYear: "2016"
    },
    signature: {
      name: "Vikram Nair",
      designation: "Adviser to Sembawang GRC Grassroots Organisations"
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

  it("is not valid when award is missing", () => {
    const data = { ...minimalValid };
    delete data.award;
    const signing = () => issueDocument(data, schema);
    expect(signing).toThrow("Invalid document");
  });



  it("is not valid when required award fields are missing", () => {
    const data = { ...minimalValid, award: {} };
    const signing = () => issueDocument(data, schema);
    expect(signing).toThrow("Invalid document");
  });

  it("is not valid when signature.name is missing", () => {
    const data = { ...minimalValid, signature: { designation: "Adviser" } };
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

  it("should fail when both achievementYear and achievementDate are missing in award", () => {
    const data = JSON.parse(JSON.stringify(minimalValid));
    delete data.award.achievementYear;
    delete data.award.achievementDate;
    const signing = () => issueDocument(data, schema);
    expect(signing).toThrow("Invalid document");
  });

  it("should fail when achievementDate is not a valid date", () => {
    const data = JSON.parse(JSON.stringify(minimalValid));
    data.award.achievementDate = "not-a-date";
    const signing = () => issueDocument(data, schema);
    expect(signing).toThrow("Invalid document");
  });

  it("should fail when achievementYear is not a valid year", () => {
    const data = JSON.parse(JSON.stringify(minimalValid));
    data.award.achievementYear = "20X6";
    const signing = () => issueDocument(data, schema);
    expect(signing).toThrow("Invalid document");
  });

  it("should fail when signature.name is missing", () => {
    const data = JSON.parse(JSON.stringify(minimalValid));
    delete data.signature.name;
    const signing = () => issueDocument(data, schema);
    expect(signing).toThrow("Invalid document");
  });

  // Add more tests as needed for other custom or inherited properties
});
