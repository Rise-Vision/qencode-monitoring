const {beginNewEncodingHealthCheck} = require("../src/index.js");
const assert = require("assert");

describe("New Encoding Health Check", ()=>{
  it("calls response callback", (done)=>{
    beginNewEncodingHealthCheck({}, {send: (result)=>{
      assert(result);
      done();
    }});
  });
});
