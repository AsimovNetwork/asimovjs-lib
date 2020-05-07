'use strict'

import * as fs from 'fs'
import * as path from 'path'
import * as vm from 'vm'
import { Base64 } from 'js-base64';
import * as request from 'request';
import { JsonRpcProvider } from '../providers/JsonRpcProvider'

export class FileImports {

  constructor() {}

  handleGithubCall(root: string, path: string) {

    return new Promise((resolve: any, reject: any) => {
      request.get({
          /// TODO exposed access-token !!!
          url: 'https://api.github.com/repos/' + root + '/contents/' + path + '?access_token=0cd95d849fd914d86ace981c3fab0cfd72ae26e0',
          json: true,
          headers: {
            "User-Agent": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36"
          }
        },
        (err, r, data) => {
          if (err) {
            reject(err || 'Unknown transport error')
            return
          }
           if(!data){
             reject('No data found')
             return
           }
          if ('content' in data) {
            resolve(Base64.decode(data.content))
          } else if ('message' in data) {
            resolve(data.message)
          } else {
            resolve('Content not received')
          }
        })
    });
  }

  handleIPFS(url) {
    // replace ipfs:// with /ipfs/
    url = url.replace(/^ipfs:\/\/?/, 'ipfs/')

    return new Promise((resolve: any, reject: any) => {
      request.get({
          url: 'https://gateway.ipfs.io/' + url
        },
        (err, r, data) => {
          if (err) {
            resolve(err || 'Unknown transport error')
          }
          reject(null, data, url)
        })
    });
  }

  handleHttpCall(url, cleanUrl) {

    return new Promise((resolve: any, reject: any) => {
      request.get({
          url
        },
        (err, r, data) => {
          if (err) {
            return reject(err || 'Unknown transport error')
          }
          resolve(null, data, cleanUrl)
        })
    });

  }

  handlers() {
    return [{
        type: 'github',
        match: /^(https?:\/\/)?(www.)?github.com\/([^/]*\/[^/]*)\/(.*)/,
        handler: (match: string[]) => {
          return this.handleGithubCall(match[3], match[4])
        }
      },
      {
        type: 'http',
        match: /^(http?:\/\/?(.*))$/,
        handler: (match: string[]) => {
          return this.handleHttpCall(match[1], match[2])
        }
      },
      {
        type: 'https',
        match: /^(https?:\/\/?(.*))$/,
        handler: (match: string[]) => {
          return this.handleHttpCall(match[1], match[2])
        }
      },
      {
        type: 'ipfs',
        match: /^(ipfs:\/\/?.+)/,
        handler: (match: string[]) => {
          return this.handleIPFS(match[1])
        }
      }
    ]
  }


  isRelativeImport(url) {
    return /^([^/]+)/.exec(url)
  }

  import(url) {
    var self = this;
    var handlers = this.handlers();
    var found = false;
    let handler: any;
    let match: any;
    handlers.forEach((h) => {
      if (found) {
        return
      }
      var m = h.match.exec(url)

      if (m) {
        found = true
        handler = h;
        match = m;
      }
    });

    if (found) {
      return handler.handler(match);

    } else if (/^[^:]*:\/\//.exec(url)) {
      return `Unable to import "${url}": Unsupported URL schema`;

    } else {
      return `Unable to import "${url}": File not found`;
    }

  }
};


export class FileManager {
  private fileImports: FileImports;
  private filesProviders: any = {}
  constructor() {

    this.fileImports = new FileImports()

  }

  private fileProviderOf(filepath: string) {
    if (!filepath) {
      return null
    }

    var provider = filepath.match(/[^/]*/)
    var type = '';
    if (provider !== null) {
      type = provider[0]
    } else {
      for (var handler of this.fileImports.handlers()) {
        if (handler.match.exec(filepath)) {
          type = handler.type
        }
      }
    }
    return type
  }

  private importExternal(url: string) {
    return this.fileImports.import(url);
  }
  public async importFile(url: string) {
    const self = this;

    var type = self.fileProviderOf(url);
    var result;

    //node env
    if (typeof window == 'undefined' && !type) {
      let absoluteUrl = path.resolve(process.cwd(), url)
      let fs = require("fs")
      let readFile = require('util').promisify(fs.readFile)
      let text = await readFile(absoluteUrl, 'utf-8')
      return text
    }

    //browser env
    if (type === 'localhost') {
      return `file provider ${type} not available while trying to resolve ${url}`;
    } else if (this.fileImports.isRelativeImport(url) && !type) {
      // try to resolve localhost modules (aka truffle imports)
      var splitted = /([^/]+)\/(.*)$/g.exec(url);
      return ""
    } else {
      return self.importExternal(url)
    }
  }
  public static importRemoteScript(url: string) {

    return new Promise((resolve, reject) => {
      if (typeof window == 'undefined') {
        JsonRpcProvider.Get({ url: url }).then(res => {
          let text = res.data
          let filePath = path.resolve(__dirname, '../compiler/asimov.js')
          fs.writeFile(filePath, text, {}, (err) => {
            if (err) {
              reject(err)
              return
            }
            delete require.cache[require.resolve('../compiler/asimov.js')]
            let Module = require('../compiler/asimov.js')
            resolve(Module)
          })

        }).catch(e => {
          reject(e)
          return
        })
      } else {
        var dom = document.createElement('script');
        dom.src = url
        window['Module'] = undefined;
        dom.onload = function() {
          resolve(window['Module']);
        }
        document.body.append(dom);
      }
    })

  }
}
