/**
 * SecureChannel.js
 */
module.exports = (function(){
    "use strict"
    return function(bam){        
        let Instant = require('../system/instant'), // ctor
            _ = require('lodash'),
            crypto = require('crypto'),
            requestJson = require('request-json'),
            request = require('request')            ,
            forge = require('node-forge'),
            random = forge.random,
            pki = forge.pki,
            aes = forge.aes,
            util = forge.util,
            options = bam.tools(),
            $ = options.lodash,
            secureChannelProxy = bam.secureChannelProxy;

        bam.secureInvoke = function(className, method, args, format, options){
            if(!$.isArray(args)){
                var a = [];
                a.push(args);
                args = a;
            }

            function getPostData(session){
                var params = [];
                _.each(args, function(arg){
                    params.push(JSON.stringify(arg));
                });

                params = JSON.stringify(params);
                var jsonParams = JSON.stringify({jsonParams: params});

                var secureParams = [JSON.stringify(className), JSON.stringify(method), JSON.stringify(jsonParams)];
                secureParams = JSON.stringify({jsonParams: secureParams});
                return {
                    plain: secureParams,
                    cipher: session.encrypt(secureParams)
                }
            }

            function createValidationToken(session, plainPostData){
                var nonce = new Instant().toString(),
                    hash = _sha256(nonce + ":" + plainPostData),
                    hashCipher = session.rsaEncrypt(hash),
                    nonceCipher = session.rsaEncrypt(nonce),            
                    hmac = forge.hmac.create();

                hmac.start('sha256', session.symmetricKey64);
                hmac.update(plainPostData);
                var signature = 'sha256=' + hmac.digest().toHex();

                return {
                    Signature: signature,
                    HashCipher: hashCipher,
                    NonceCipher: nonceCipher
                }
            }

            let promise = new Promise((resolve, reject)=> {
                secureChannelClient.startSession()
                    .then(function(session){
                        var root = bam.proxyRoot(className).toString(),
                            url = root + "SecureChannel/Invoke.json?nocache=" + bam.randomString(4) + "&",
                            postData = getPostData(session),
                            validationToken = createValidationToken(session, postData.plain),
                            config = {
                                url: url,
                                dataType: "json",
                                data: {
                                    'content-type': 'text/plain; charset-utf-8',
                                    body: postData.cipher
                                },
                                body: postData.cipher,
                                global: false,
                                crossDomain: false,
                                type: "POST",
                                headers: {
                                    "X-Bam-Sps-Session": session.clientId,
                                    "X-Bam-Validation-Token": validationToken.HashCipher,
                                    "X-Bam-Timestamp": validationToken.NonceCipher,
                                    "X-Bam-Signature": validationToken.Signature,
                                    "X-Bam-Padding": "true"
                                }
                            };
                        request.post(config, (err, res, body) => {
                            let responseData = JSON.parse(body);
                            if(responseData.Success){
                                let json = session.decrypt(responseData.Data);
                                resolve(JSON.parse(json));
                            }else{
                                reject(responseData.Message);
                            }
                        })
                        // client.post("SecureChannel/Invoke.json?nocache=" + bam.randomString(4), postData.cipher, (err, res, responseData) => {
                        //     if (responseData.Success) {
                        //         let json = session.decrypt(responseData.Data);
                        //         resolve(JSON.parse(json));
                        //     } else {
                        //         reject(responseData.Message);
                        //     }
                        // })
                });
            });
            return promise;
        };

        function _createAesKey(){
            var key = random.getBytesSync(16),
                base64Key = util.encode64(key),
                iv = random.getBytesSync(16),
                base64IV = util.encode64(iv);

            return {
                key: key,
                base64Key: base64Key,
                iv: iv,
                base64IV: base64IV
            }
        }

        function _sha256(val){
            return crypto.createHash('sha256').update(val).digest('hex');
        }

        var sessionStarter = null;
        function startSession(){
            if(sessionStarter === null){
                let prom = new Promise((resolve, reject) => {
                    secureChannelProxy.initSession(new Instant())
                        .then(function(response){
                            if(response.Success){
                                var createdKey = _createAesKey(),
                                    publicKey = pki.publicKeyFromPem(response.Data.PublicKey),
                                    key = createdKey.base64Key,
                                    keyHash = _sha256(key),
                                    keyCipher = publicKey.encrypt(key),
                                    keyCipherB64 = util.encode64(keyCipher),
                                    keyHashCipher = publicKey.encrypt(keyHash),
                                    keyHashCipherB64 = util.encode64(keyHashCipher),
                                    iv = createdKey.base64IV,
                                    ivHash = _sha256(iv),
                                    ivCipher = publicKey.encrypt(iv),
                                    ivCipher64 = util.encode64(ivCipher),
                                    ivHashCipher = publicKey.encrypt(ivHash),
                                    ivHashCipher64 = util.encode64(ivHashCipher),
                                    clientId = response.Data.ClientIdentifier;

                                secureChannelProxy.setSessionKey({
                                    PasswordCipher: keyCipherB64,
                                    PasswordHashCipher: keyHashCipherB64,
                                    IVCipher: ivCipher64,
                                    IVHashCipher: ivHashCipher64,
                                    UsePkcsPadding: true
                                }, {
                                    headers: {
                                        "X-Bam-Sps-Session": clientId
                                    }
                                })
                                .then(function(r){
                                    if(r.Success){
                                        var session = _.extend({}, secureChannelClient.session, {
                                            publicKey: publicKey,
                                            symmetricKey: createdKey.key,
                                            symmetricIV: createdKey.iv,
                                            symmetricKey64: createdKey.base64Key,
                                            symmetricIV64: createdKey.base64IV,
                                            started: true,
                                            clientId: clientId
                                        });
                                        resolve(session);
                                    }else{
                                        reject({message: r.Message});
                                    }
                                })
                                .catch(function(r){
                                    reject({message: r.Message});
                                })
                            }else{
                                reject({message: response.Message});
                            }
                        })
                        .catch(function(r){
                            reject(prom, {message: r.Message});
                        });
                });                

                sessionStarter = prom;
            }

            return sessionStarter;
        }

        let secureChannelClient = _.extend({
            startSession: startSession,
            session: {
                message: "",
                started: false,
                initializer: null,
                clientId: "",
                publicKey: {}, // set by startSession; should be a forge public rsa key
                symmetricKey: {}, // set by startSession
                symmetricIV: {}, // set by startSession
                createAesKey: _createAesKey,
                aes: {
                    encrypt: function(string, key, iv){
                        let encryptor = aes.createEncryptionCipher(key, "CBC"),
                            data = string + util.encode64(random.getBytesSync(1)).substr(0,2);//string + _.randomString(2); // random salt gets desalinated by server

                        encryptor.start(iv);
                        encryptor.update(util.createBuffer(data));
                        encryptor.finish();
                        return util.encode64(encryptor.output.data);
                    },
                    decrypt: function(b64Cipher, key, iv){
                        let decryptor = aes.createDecryptionCipher(key, 'CBC'),
                            encryptedBytes = util.decode64(b64Cipher);

                        decryptor.start(iv);
                        decryptor.update(util.createBuffer(encryptedBytes));
                        decryptor.finish();

                        return decryptor.output.data.substring(0, decryptor.output.data.length - 2); // truncate 2 char salt
                    }
                },
                rsaEncrypt: function(data){
                    return util.encode64(this.publicKey.encrypt(data));
                },
                encrypt: function(data){
                    return this.aes.encrypt(data, this.symmetricKey, this.symmetricIV);
                },
                decrypt: function(cipher){
                    return this.aes.decrypt(cipher, this.symmetricKey, this.symmetricIV);
                }
            }
        }, secureChannelProxy); 
        
        return secureChannelClient;
    }
})()
