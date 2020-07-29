import * as functions from 'firebase-functions';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
// 

const admin = require('firebase-admin');


  admin.initializeApp();



  //aceitar friend Reqest
export const acceptFriendRequest = functions.https.onCall((data, context) => {
  
  const db = admin.firestore();

  const user1 = context.auth?.uid;
  const user2 = data.user;

  var object = {
    user1 : user1,
    user2 : user2,
  }

  console.log("User with ID: ", user1 , " user 2", user2,);

  
  if(user1 && typeof user1 == "string" && user2 && typeof user2 == "string" && user1 !== user2){

    //Verifica se já são amigos
    db.doc("amigo/"+object.user1+"/amigo/"+object.user2).get().then(function
      (doc: { exists: any; data: () => any; }) {
            
    if (!doc.exists) {
          console.log("Document data:", doc.data());
     

      //gera a pasta de mensagens
      db.collection("mensagens").add(object).then(function(docRef: { id: any; }) {

        console.log("Mensagem Criada");
      //adiciona como amigo
      db.doc("amigo/"+object.user1+"/amigo/"+object.user2)
      .set({id: object.user2 , path: "mensagens/"+docRef.id,});

      db.doc("amigo/"+object.user2+"/amigo/"+object.user1).
      set({id: object.user1 , path: "mensagens/"+docRef.id,});

      }).then(function(){
      //apaga as request
      db.collection('request').doc( object.user1 + '/request/' + object.user2).delete();
      db.collection('request').doc( object.user2 + '/request/' + object.user1).delete();
      });


    } else {
          // doc.data() will be undefined in this case
          console.log("No such document!");
      }
  });
  }
});



  //enviar friend request

export const sendFriendRequest = functions.https.onCall((data, context) => {

  const db = admin.firestore();

  const user1 = data.user;
  const user2 = context.auth?.uid;

  var object = {
    user1 : user1,
    user2 : user2,
  }

  console.log("User with ID: ", user1 , " user 2", user2,);
  
  if(user1 && typeof user1 == "string" && user2 && typeof user2 == "string" && user1 !== user2){

    //Verifica se já são amigos
    db.doc("amigo/"+object.user1+"/amigo/"+object.user2).get().then(function
      (doc: { exists: any; data: () => any; }) {
       
        if (!doc.exists){

          //pega as informações do perfil do requisitador
          db.doc("user/"+object.user2).get().then(function(doc1: { exists: any; data: () => any; }) {

            let data1 = doc1.data();
        
            console.log("User data" + data1);
            //coloca a informação na pasta de request
            db.collection('request').doc( object.user1 + '/request/' + object.user2).set({
            foto : data1.foto , id : data1.id , nome: data1.nome,
          });

          });
        }else{
          console.log("Are already friends");
        }
      }); 
  }else{
    console.log("Erro");
  }
  
 });


 //desfazer amizade

 export const removeFriend = functions.https.onCall((data, context) => {


  const db = admin.firestore();

  const user1 = context.auth?.uid;
  const user2 = data.user;

  var object = {
    user1 : user1,
    user2 : user2,
  }

  console.log("User with ID: ", user1 , " user 2", user2,);
  
  if(user1 && typeof user1 == "string" && user2 && typeof user2 == "string" && user1 !== user2){

    //Verifica se já são amigos
    db.doc("amigo/"+object.user1+"/amigo/"+object.user2).get().then(function
      (doc2: { exists: any; data: () => any; }) {
       
        let data2 = doc2.data().path;

        if (doc2.exists){

          db.doc(data2).delete(data.path);

          db.collection('amigo').doc( object.user1 + '/amigo/' + object.user2).delete();
          db.collection('amigo').doc( object.user2 + '/amigo/' + object.user1).delete();

        }else{
          console.log("Are Not friends");
        }
      }); 
  }else{
    console.log("Erro");
  }
  
 });




 //Quando o encontro é criado automaticamente o caminho na pasta do dono do encontro

 exports.useMultipleWildcards = functions.firestore
 .document('encontro/{userId}/atributos/{messageId}')
 .onWrite((change, context) => {

  const db = admin.firestore();
   // If we set `/users/marie/incoming_messages/134` to {body: "Hello"} then
   // context.params.userId == "marie";
   // context.params.messageCollectionId == "incoming_messages";
   // context.params.messageId == "134";
   // ... and ...
   // change.after.data() == {body: "Hello"}

   db.collection('caminho_encontro').doc(context.params.userId + '/encontro/' + context.params.userId).set({
    dono : context.params.userId , path : 'encontro/'+context.params.userId+'/atributos',
  });

  db.collection('/encontro/' + context.params.userId).set({
    dono : context.params.userId , path : 'encontro/'+context.params.userId+'/atributos',
  });
  

   console.log("Entrou "+ context.params.userId);
 });



 export const sendRequestEncontro = functions.https.onCall((data, context) => {

  const db = admin.firestore();

  const user = context.auth?.uid;
  const userReceive = data.user;
  const path = data.pathEncontro;

  //pega os doc da 'path' pra colocar na request
  db.doc(path + "/atributos").get().then(function(doc1: { exists: any; data: () => any; }) {

    const object2 = {
        nome: doc1.data().nome,
        descricao: doc1.data().descricao,
        dia: doc1.data().dia,
        local: doc1.data().local,
        horario: doc1.data().horario,
        foto: doc1.data().foto,
        dono: doc1.data().dono,
    }

    console.log("Entrou ");
    //Envia request
    db.collection('request_encontro').doc( userReceive + '/request/' + user).set(object2);
  });

});


export const acceptRequestEncontro = functions.https.onCall((data, context) => {

  const db = admin.firestore();

  const user = context.auth?.uid;
  const dono = data.dono;
  const path = data.path;

  //pega os dados do user que aceitou a request
  db.doc("user/"+user).get().then(function(doc1: { exists: any; data: () => any; }) {

    //adiciona no encontro  
    db.doc( path + "/membros").add(doc1.data()).then(function(){

      db.collection('caminho_encontro').doc( user + '/caminho/' + dono).set({dono: dono , path: path,});
      //exclui a request na pasta do request_encontro
      db.collection('request_encontro').doc( user + '/request/' + dono).delete();

    })

  });

});