const {beginNewEncodingHealthCheck} = require("../src/index.js");
const {instance} = require("gaxios");
const assert = require("assert");

describe("New Encoding Health Check", ()=>{
  const OK = {status: 200, data: ""};
  const TOKEN = {status: 200, data: {token: "abc"}};

  beforeEach(()=>{instance.defaults.adapter = ()=>OK});

  it("requests an access token", ()=>{
    return new Promise(res=>{
      instance.defaults.adapter = (conf)=>{
        if (conf.url.endsWith("access_token")) {res();}
        return OK;
      };

      beginNewEncodingHealthCheck({}, {send: (result)=>{}})
    });
  });

  it("creates as task (encoding job)", ()=>{
    return new Promise(res=>{
      instance.defaults.adapter = (conf)=>{
        if (conf.url.endsWith("access_token")) {return TOKEN};
        if (conf.url.endsWith("create_task")) {
          assert(conf.data === "token=abc");
          res();
        }
        return OK;
      };

      beginNewEncodingHealthCheck({}, {send: (result)=>{}})
    });
  });

  it("calls response callback", (done)=>{
    beginNewEncodingHealthCheck({}, {send: (result)=>{
      assert(result);
      done();
    }});
  });
});
