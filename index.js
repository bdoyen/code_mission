//code pour le webhook du chatbot du projet MyTeleworker.com
//version V1 - date d'écriture : Juillet ; Août ; Septembre 2018
//Tous droits réservés
'use strict';

// ---------------------------------------------------------------------------
//                          Packages et paramètres
// ---------------------------------------------------------------------------

//package nécessaires : google actions, firebase et dialogflow
const { actionssdk, Carousel, BrowseCarousel, 
  BrowseCarouselItem, Image, dialogflow, List,
  SignIn, Suggestions, BasicCard, Button, 
  Permission, DateTime, UpdatePermission } = require('actions-on-google');
const functions = require('firebase-functions');
const {WebhookClient, Payload} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const firebase = require('firebase')
const Promise = require('promise');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const express = require('express')
const bodyParser = require('body-parser');
const fs = require('fs'); 
const request = require('request');
const readline = require('readline'); 
const {google} = require('googleapis'); 

//geocoder API
const NodeGeocoder = require("node-geocoder");
const options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: 'AIzaSyDg7g0oH6F6yEMHxgO33zOclW4lpoySl0U',
  formatter: null 
};
const geocoder = NodeGeocoder(options);

//Distance API
const distance = require('google-distance-matrix');
distance.key("AIzaSyB1s__vybtEWv5NxxlWNMYn5E_-n71F4eo");

//Firebase Dynamic Links
const api_key = "AIzaSyBwiTTYYfQW6ug7RfboTkGc2Ex4NbTP1Mo"

//Anthentification pour Calendar
const privatekey = require("./privatekey.json");
const jwtClient = new google.auth.JWT(
       privatekey.client_email,
       null,
       privatekey.private_key,
       ['https://www.googleapis.com/auth/calendar']);
//authenticate request
jwtClient.authorize((err, tokens) => {
       if (err) {
         console.log(err);
         return;
       } else {
         console.log("Successfully connected!");
       }
});

const email = "myteleworker@gmail.com";
const admin_email = "myteleworker@gmail.com";
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password; //votre mot de passe ici
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

//initialisation de la base de données sous Firebase
const config = {
    apiKey: "AIzaSyBwiTTYYfQW6ug7RfboTkGc2Ex4NbTP1Mo",
    authDomain: "myteleworker-v1.firebaseapp.com",
    databaseURL: "https://myteleworker-v1-chat.firebaseio.com/",
    //storageBucket: "bucket.appspot.com"
};
firebase.initializeApp( config );

//variables d'environnement
process.env.DEBUG = 'actions-on-google:debug'; 

//variables liées à DialogFlow
const app = dialogflow({
  debug:true,
  clientId: '826822205198-9egcklci9dl7a4ekm52k3087c87fjikj.apps.googleusercontent.com',
});

//toulouse coordinates
const defaultLocationParam = {coordinates : {latitude : 43.6047, longitude : 1.4442}}
const defaultLocationName = "Toulouse, France"

//liens du type hypertexte
const mtwUrl = "https://www.myteleworker.com";

//liens du type image
const RGPDImageURL = "https://www.bwyseinternetmarketing.com/images/website/BWYSEBLOG_GDPR_PrivacyPolicy.jpg";
const financementImageURL = "http://www.gmconline.com.br/uploads/9208240a5abc8626602ec58080c85aaf.jpg";
const assurancesImageURL = "http://blog.awana.org/wp-content/uploads/2017/06/kid-hand.jpg";
const juridiqueImageURL = "http://2.bp.blogspot.com/-KJTQNlSWiwA/VU8vpOZ7wBI/AAAAAAAAHVU/w79E1T_UqUc/s320/auction-400.jpg";
const marketingImageURL = "http://www.cafpatronatomalafede.it/images/pixabay-3268750.jpg";

const logoImageURL = 'https://www.myteleworker.com/uploads/themes/v2/images/logos/logo-myteleworker.png';
const userRegisterURL = 'http://145.239.196.30:7000/user/register';
const expertRegisterURL = 'http://145.239.196.30:7000/expert/register'; 
const expertProfileUrl = 'http://145.239.196.30:7000/profile/expert';

//routing des intents de l'application
const router = express.Router();
router.use(app);


// ---------------------------------------------------------------------------
//                            Intents handlers
// ---------------------------------------------------------------------------


//intention d'accueil
app.intent("Default_Welcome_Intent", (conv) => {

  conv.user.storage = {};
  //le sign-in required a déjà été paramétré
  //sur la console Google Actions
  let {payload} = conv.user.profile;
  let given_name = payload.given_name
  let mail = payload.email

  //stockage des infos mail google + nom
  conv.user.storage.given_name = given_name
  conv.user.storage.user_email = mail

  conv.ask("Bonjour et bienvenue " + given_name +'\n'
    + "Je suis Myteleworker et je réponds à toutes les questions"
    +" des entrepreneurs et je vous mets en contact avec des experts,"
    +" pour des questions particulières");
  conv.ask("Veuillez choisir un domaine de compétence pour continuer :")
    
    conv.ask(new BrowseCarousel({
      items: [
        new BrowseCarouselItem({
          title: "RGPD",
          url: mtwUrl,
          image: new Image({
            url: RGPDImageURL,
            alt: "RGPD",
          }),
          footer: 'Tout savoir sur le RGPD',
        }),
        new BrowseCarouselItem({
          title: "Financement",
          url: mtwUrl,
          image: new Image({
            url: financementImageURL,
            alt: "Financement",
          }),
          footer: "Comment trouver des financements ?",
        }),
        new BrowseCarouselItem({
          title: "Assurances",
          url: mtwUrl,
          image: new Image({
            url: assurancesImageURL,
            alt: "Assurances",
          }),
          footer: "À quelles assurances souscrire ?",
        }),
        new BrowseCarouselItem({
          title: "Juridique",
          url: mtwUrl,
          image: new Image({
            url: juridiqueImageURL,
            alt: "Juridique",
          }),
          footer: "Quelles sont les formalités juridiques ?",
        }),
        new BrowseCarouselItem({
          title: "Marketing",
          url: mtwUrl,
          image: new Image({
            url: marketingImageURL,
            alt: "Marketing",
          }),
          footer: "Quelle stratégie marketing ?",
          })
        ],
    }))

    //redirections
    conv.ask(new Suggestions("RGPD"));
    conv.ask(new Suggestions("Financement"));
    conv.ask(new Suggestions("Assurances"));
    conv.ask(new Suggestions("Juridique"));
    conv.ask(new Suggestions("Marketing"));
})


app.intent("canal_choice", ( conv, params, option ) => {
  //ne pas oublier 'params' comme paramètre sinon option == vide !

  let SELECTED_ITEM_RESPONSES = conv.user.storage.SELECTED_ITEM_RESPONSES;
  let expert_email = SELECTED_ITEM_RESPONSES[option];
  conv.user.storage.expert_email = expert_email;
  conv.ask("Comment souhaitez-vous communiquer avec cet expert ?");
  conv.ask(new Suggestions("Par Chat"));
  conv.ask(new Suggestions("En visio"));
})


app.intent("expert_chat", ( conv ) => {

  //récupération du contexte de la mise en relation
    //Les questions posées au bot
    var context = []
    if(!conv.user.storage.pass_question){
      var conv_contexts = conv.contexts.input;
      var tab_conv_contexts = Object.keys(conv_contexts);
      var cleaned_tab_conv_contexts = cleanTab(tab_conv_contexts, forbidden_keywords);
      var mapped_cleaned_tab_conv_contexts = mapTab(cleaned_tab_conv_contexts, mapping);
      context = mapped_cleaned_tab_conv_contexts;
    } else {
      context = [conv.user.storage.question]
    }

    //éléments pour fixer l'heure du rendez-vous
    let date = new Date();
    let date1 = date
    let hours = date.getHours()
    let minutes = date.getMinutes()
    date.setHours( hours + 1 )
    date.setMinutes( minutes )
    date1.setHours( hours + 2 )
    date1.setMinutes( minutes )
    let startDateTime = date.toISOString() || '';  
    let endDateTime = date1.toISOString() || ''; 

    //éléments de description et d'envoi du rendez-vous
    let summary = 'Rendez-vous chat avec un expert MyTeleworker.com';
    let description = 'Un rendez-vous';
    let user = conv.user.storage.user_email;
    let expert = conv.user.storage.expert_email;
    let theme = conv.user.storage.skill;
    let mode = "chat";

    //envoi du rendez-vous
    //plus : stockage Firebase des infos rdv
    //envoi du context des questions posées au bot
    insertEvents(jwtClient, startDateTime, endDateTime, 
      summary, description, user, expert, 
      theme, context, mode)

    //confirmation par le bot
    conv.ask("Vous pouvez désormais accéder à une chat-room privée" 
      + " avec l'expert choisi en cliquant sur le lien qui vous a été envoyé"
      + " sur votre adresse gmail");

    //redirections
    conv.ask(new Suggestions('Menu'))
    conv.ask(new Suggestions("Expert"));
    conv.ask(new Suggestions('Blog'))
})


//choix d'une date
app.intent('date', (conv, params) => {

    let email = conv.user.storage.user_email || '';
    let location = conv.user.storage.location || {};
    var lat = location.coordinates.latitude;
    var long = location.coordinates.longitude;
    var firstname = conv.user.storage.firstname || '';
    var lastname = conv.user.storage.lastname || '';
    var id = "google_assistant:" + Math.random().toString(26).slice(2);

    //enregistrement des données de géo-localisation
    //Toulouse est l'adresse par défaut
    geocoder.reverse({ lat : lat, lon : long }, function(err, res) {
      if(err){
        let adrr1 = defaultLocationName;
        let city = "Toulouse";
        let country = "France";
        let zip = "34000";
        writeUser(email, firstname, lastname, adrr1, city, country, zip, id);
      } else {
        let adrr1 = res[0].streetNumber + res[0].streetName;
        let city = res[0].city;
        let country = res[0].country;
        let zip = res[0].zipcode;
        writeUser(email, firstname, lastname, adrr1, city, country, zip, id);
      }
    });

    //demander un jour et l'heure
    conv.ask("Veuillez taper une heure et une date sous le format"
        + " '8h30 le 1 janvier 2019' pour prendre un rendez-vous expert")
});


//envoi du lien Hangout de rendez-vous entre user et expert
app.intent('rdv', ( conv, params ) => {

    //récupération du contexte de la mise en relation
    //Les questions posées au bot
    var context = []
    if(!conv.user.storage.pass_question){
      var conv_contexts = conv.contexts.input;
      var tab_conv_contexts = Object.keys(conv_contexts);
      var cleaned_tab_conv_contexts = cleanTab(tab_conv_contexts, forbidden_keywords);
      var mapped_cleaned_tab_conv_contexts = mapTab(cleaned_tab_conv_contexts, mapping);
      context = mapped_cleaned_tab_conv_contexts;
    } else {
      context = [conv.user.storage.question]
    }

    //éléments pour fixer l'heure du rendez-vous
    let time = new Date(conv.parameters.time);
    let date = new Date(conv.parameters.date);
    let date1 = date
    let hours = time.getHours()
    let minutes = time.getMinutes()
    date.setHours( hours + 1 )
    date.setMinutes( minutes )
    date1.setHours( hours + 2 )
    date1.setMinutes( minutes )
    let startDateTime = date.toISOString() || '';  
    let endDateTime = date1.toISOString() || ''; 

    //éléments de description et d'envoi du rendez-vous
    let summary = 'Rendez-vous expert MyTeleworker.com';
    let description = 'Un rendez-vous';
    let user = conv.user.storage.user_email;
    let expert = conv.user.storage.expert_email;
    let theme = conv.user.storage.skill;
    let mode = "visio";

    console.log(context)

    //envoi du rendez-vous
    //plus : stockage Firebase des infos rdv
    //envoi du context des questions posées au bot
    insertEvents(jwtClient, startDateTime, endDateTime, 
      summary, description, user, expert, 
      theme, context, mode)

    //confirmation par le bot
    conv.ask("Votre rendez-vous a bien été enregistré"
    + " et vous recevrez dans quelques instants un mail de confirmation"
    + " avec le lien pour accéder à une chat-room privée avec l'expert choisi");
    
    //redirections
    conv.ask(new Suggestions('Menu'))
    conv.ask(new Suggestions("Expert"));
    conv.ask(new Suggestions('Blog'))
});


//intent de demande de Permission d'envoi de notifs
app.intent("setup_push_article", (conv) => {
  conv.user.storage.requestedPermission = "ARTICLE_PUSH";
  conv.ask(new Permission({ 
    context: 'Voulez-vous recevoir en temps réel les nouveaux articles du blog MyTeleworker ?',
    permissions: ['UPDATE'],
    updatePermissionValueSpec: {
        arguments: undefined,
        intent: "send_lastest_article"
    } }));
});


app.intent("send_latest_article", (conv) => {

  var results = [];
  return firebase.database().ref('articles').once('value').orderBy("create_date").limit(1).then( ( snap ) => {
      if(!snap.val()){
        conv.ask("Le blog de MyTeleworker est malheureusement à court "
          + " d'articles pour le moment");

        //redirections
        conv.ask(new Suggestions('Menu'));
        conv.ask(new Suggestions("Expert"));
        conv.ask(new Suggestions("Blog"));

        return Promise.resolve( conv );  
      }else{

          var results = []
          var data_obj = snap.val()
          let key;
          for(key in data_obj){
            results.push(data_obj[key])
          } 
          conv.ask("Voici le dernier article en date du blog de MyTeleworker :");
          var items = [];

          let title = results[0].news_title || '';
          let pic = results[0].icon || '';
          let text = results[0].summary || '';
          let blog_url = results[0].news_url || '';
          items.push(new BrowseCarouselItem({
            title: title,
            url: blog_url,
            description: text,
            image: new Image({
              url: pic,
              alt: title,
            }),
            footer: "Item "+ String(1) +" footer",
          }))

          conv.ask(new BasicCard({
              text: items[0].text || '',
              title: items[0].title || '',
              buttons: new Button({
                title: 'En savoir plus',
                url: items[0].news_url || '',
              }),
              image: new Image({
                url: items[0].icon || '',
                alt: 'Blog de MyTeleworker',
              }),
              display: 'CROPPED',
            }));

          //redirections
          conv.ask(new Suggestions('Menu'));
          conv.ask(new Suggestions("Expert"));
          conv.ask(new Suggestions("Blog"));

          return Promise.resolve( conv ); 
      }
      }) 
})


//intent "tampon" de récupération des données du compte Google
app.intent('ask_for_permissions_all', ( conv ) => {
  conv.user.storage.requestedPermission = "EXPERTS";
  const options = {
  context: "Pour une meilleure suggestion d'experts, j'aurais besoin "
    + "d'accéder à quelques unes de vos données",
  permissions: ['NAME','DEVICE_PRECISE_LOCATION', 'DEVICE_COARSE_LOCATION'],
  };
  conv.ask(new Permission( options ));
});


app.intent("handle_permission", (conv, params, confirmationGranted) => {
  if (!confirmationGranted) {
    throw new Error("Permission non-fournie...");
  }
  const {requestedPermission} = conv.user.storage;
  if(requestedPermission === "ARTICLE_PUSH"){
    let userID = conv.arguments.get('UPDATES_USER_ID');
    let intent = "send_latest_rdv";
    let user = conv.user.storage.user_email;
    writeReminder ( userID, user, intent )
    conv.ask("très bien, vous recevrez les derniers articles MyTeleworker"
      + " dès leur sortie sur le blog"); 

    //redirections
    conv.ask(new Suggestions('Menu'))
    conv.ask(new Suggestions("Expert"));
    conv.ask(new Suggestions('Blog'))

  } else if( requestedPermission === "EXPERTS"){
     var results = [];
     let skill = conv.user.storage.skill
     if (!skill){ skill = "RGPD" }
     var skills = [];
     skills.push(skill)

     var {location} = conv.device;
     var {name} = conv.user;

     if( confirmationGranted ){
        if (location && name) {
          conv.user.storage.location = location;
          conv.user.storage.firstname = name.given;
          conv.user.storage.lastname = name.family;
        }
      } else {
          conv.user.storage.location = defaultLocation;
          conv.user.storage.firstname = "Utilisateur";
          conv.user.storage.lastname = "Utilisateur";
      }

     
     return firebase.database().ref('experts/').once('value').then( ( snap ) => {
          if(!snap.val()){
            conv.ask("Je n'ai malheureusement pas trouvé d'experts correspondant "
             +"à votre demande de compétences");

            //redirections
            conv.ask(new Suggestions('Menu'));
            conv.ask(new Suggestions("Expert"));
            conv.ask(new Suggestions("Blog"));
            return Promise.resolve( conv ); 
         
          }else{

              console.log("la")
              //définition du point d'origine des calculs
              //en fonction de la latitude et longitude
              var lat = conv.user.storage.location.coordinates.latitude
              var long = conv.user.storage.location.coordinates.longitude
              var origins = [lat+','+long];

              //avoir les distances des experts de la bonne skill
              var destinations = [];

              //sélectionner les experts en fonction de la bonne skill 
              snap.forEach( ( childSnap ) => {
                let key = childSnap.key;
                let data = snap.val()[key];
                let dest = data.adrr1 + data.city + data.zip;
                var expert_skills = Object.keys(data.skill || {});
                var bool = false;
                if(expert_skills.length !== 0){
                  for(var i=0;i<expert_skills.length;i++){
                          bool = bool || skills.includes(expert_skills[i]);
                  }
                }
                if(bool){
                  results.push(data)
                  destinations.push(dest)
                 }
              });

              var results_distances = [];
              return new Promise( function(resolve, reject) {

                console.log("ici")
                distance.matrix(origins, destinations, function (err, distances) {
                  if (err) {
                      return console.log(err);
                  }
                  if(!distances) {
                      return console.log('pas de distances');
                  }
                  if (distances.status === 'OK') {
                      console.log(distances)
                      for (var i=0; i < origins.length; i++) {
                          for (var k = 0; k < destinations.length; k++) {
                              var origin = distances.origin_addresses[i];
                              var destination = distances.destination_addresses[k];
                              if (distances.rows[0].elements[k].status === 'OK') {
                                  var distance = distances.rows[i].elements[k].distance.value
                                  results_distances.push(distance)
                                  results[k].distance = distance
                              } else {
                                  console.log("pas atteignable");
                              }
                          }
                      }
                  }
                  results = results.sort(function (a, b){return a.distance - b.distance})
                  conv.ask("Voici une liste d'experts que vous pouvez contacter "
                  +"en cliquant sur leur nom : ");
                  var items = {};
                  var SELECTED_ITEM_RESPONSES = {}
                  for(var j=0;j<results.length;j++){
                     let firstname = results[j].firstname || '';
                     let name = results[j].name || '';
                     let pic = results[j].image || '';
                     let job = results[j].job || '';
                     let activity = results[j].activity || '';
                     let expert_email = results[j].email || '';
                     let title = "contacter " + firstname + name;
                     let elem = {title:title,
                      description:activity,
                      image:new Image({
                        url: pic,
                        alt: title,
                      })};
                     items[title] = elem;
                     SELECTED_ITEM_RESPONSES[title] = expert_email;
                  }
                  //Attention : DialogFlow ne va pas au-delà de 10 items
                  //pour un Carousel
                  items = firstN(items, 10)
                  conv.user.storage.SELECTED_ITEM_RESPONSES = SELECTED_ITEM_RESPONSES;
                  conv.ask(new Carousel({
                    items: items,
                  }));
                  resolve();
                })
              }) 
          }
        }) 
      }
})


//consultation des derniers articles de blog du CMS
app.intent("blog", ( conv ) => {

  var results = [];

    return firebase.database().ref('articles').once('value').then( ( snap ) => {
      if(!snap.val()){
        conv.ask("Le blog de MyTeleworker est malheureusement à court d'articles"
          + " pour le moment");

        //redirections
        conv.ask(new Suggestions("S'abonner"));
        conv.ask(new Suggestions('Menu'));
        conv.ask(new Suggestions("Expert"));

        return Promise.resolve( conv );  
      }else{
          var data_obj = snap.val()
          let key;
          for(key in data_obj){
            results.push(data_obj[key])
          } 
          conv.ask("Voici une liste des derniers articles du blog de MyTeleworker");
          var items = [];

          for(var j=0;j<results.length;j++){
             let title = results[j].news_title || '';
             let pic = results[j].icon || '';
             let text = results[j].summary || '';
             let blog_url = results[j].news_url || '';
             items.push(new BrowseCarouselItem({
                title: title,
                url: blog_url,
                description: text,
                image: new Image({
                  url: pic,
                  alt: title,
                }),
                footer: "Item "+ String(j+1) +" footer",
              }))
          }

          //affichage de 10 articles au max
          items = items.slice(0,9)

          //un seul article => une basic card
          if( items.length === 1) {
            conv.ask(new BasicCard({
              text: items[0].text || '',
              title: items[0].title || '',
              buttons: new Button({
                title: 'En savoir plus',
                url: items[0].blog_url || '',
              }),
              image: new Image({
                url: items[0].pic || '',
                alt: 'Blog de MyTeleworker',
              }),
              display: 'CROPPED',
            }));
          } else {
            conv.ask(new BrowseCarousel({
              items: items
            }));
            }

          //redirections
          conv.ask(new Suggestions("S'abonner"));
          conv.ask(new Suggestions('Menu'));
          conv.ask(new Suggestions("Expert"));

          return Promise.resolve( conv ); 
      }
      }) 
})


//consultation des rendez-vous actuels avec des experts
app.intent("my_rdv", ( conv ) => {

  //l'utilisateur doit être signed-in pour parler au bot
  //on récupère donc bien son mail pour faire la requête
  //des rendez-vous
  return firebase.database().ref('rdv').on('value', ( snap ) => {
    
    if(!snap.val()){
      conv.ask("Vous n'avez pas encore pris de rendez-vous "+
      "avec un expert");
      conv.ask("Veuillez au préalable choisir un domaine de compétences : ")
      conv.ask(new Suggestions("RGPD"));
      conv.ask(new Suggestions("Financement"));
      conv.ask(new Suggestions("Juridique"));
      conv.ask(new Suggestions("Assurances"));
      conv.ask(new Suggestions("Marketing"));

      return Promise.resolve( conv ); 
        
      }else{

        var data_obj = snap.val()
        var key;
        var user = conv.user.storage.user_email
        var rdv = []

        //remplissage des rdvs prochains
        for(key in data_obj){
            if( user === data_obj[key].user){
              let now = new Date();
              let date = new Date(data_obj[key].date)
                if( date >= now){
                  rdv.push(data_obj[key])
                }
            }
        }

        if(!rdv){

          conv.ask("Vous n'avez pas pris de rendez-vous "+
          "avec un expert dans les prochains jours");
          conv.ask("Vous pouvez accéder aux experts en choisissant un"
            + " de ces dommaines de compétences : ")
          conv.ask(new Suggestions("RGPD"));
          conv.ask(new Suggestions("Financement"));
          conv.ask(new Suggestions("Juridique"));
          conv.ask(new Suggestions("Assurances"));
          conv.ask(new Suggestions("Marketing"));

          return Promise.resolve( conv ); 

        } else if (rdv.length === 1){

          let date = rdv[0].date
          let startDateDay = date.split`T`[0]
          let startDateHour = date.split`T`[1] 
          conv.ask("Voici votre prochain rendez-vous "
            + "avec un expert MyTeleworker : ");
          conv.ask(new BasicCard({
            text: "votre prochain rendez-vous expert",
            subtitle: "le " + startDateDay + " à " + startDateHour,
            title: "rendez-vous",
            image: new Image({
              url: logoImageURL,
              alt: 'MyTeleworker',
            }),
            display: 'CROPPED',
          }));

          conv.ask(new Suggestions("Menu"));
          conv.ask(new Suggestions("Expert"));
          conv.ask(new Suggestions("Blog"));

          return Promise.resolve( conv ); 

        } else {

          conv.ask("Voici la liste de vos prochains rendez-vous "
            +"avec des experts MyTeleworker : ");

          var items = [];
          var suggestions = [];

          //carousel
          for(var m=0;m<rdv.length;m++){
            let single_rdv = rdv[m];
            let date = single_rdv.date
            let theme = single_rdv.theme
            let startDateDay = date.split`T`[0]
            let startDateHour = date.split`T`[1] 
            items.push(new BrowseCarouselItem({
              title: "Rdv " + String(m+1),
              url : "https://www.myteleworker.com",
              description: "le " + startDateDay 
                + " à " + startDateHour + " avec " 
                + single_rdv.expert
                + " sur le thème" + theme,
              image: new Image({
                url: logoImageURL,
                alt: "rdv" + String(m+1),
              }),
              footer: "Item " + String(m+1) +" footer",
            }))
          }

          //affichage de 5 rdv au max
          items = items.slice(0,9)

          conv.ask(new BrowseCarousel({
            items: items
          }));

          //redirections
          conv.ask(new Suggestions('Menu'))
          conv.ask(new Suggestions("Expert"));
          conv.ask(new Suggestions('Blog'))

          return Promise.resolve( conv ); 
        }
      }
    })
});

app.intent("menu", ( conv ) => {
  conv.ask("Je peux répondre à vos questions dans les domaines suivants :");
  conv.user.storage.pass_question = 0
  //redirections
  conv.ask(new Suggestions('RGPD'))
  conv.ask(new Suggestions("Financement"));
  conv.ask(new Suggestions('Assurances'));
  conv.ask(new Suggestions("Juridique"));
  conv.ask(new Suggestions('Marketing'));
})

//renseignement supplémentaire 1
app.intent("renseigner_supp_1", ( conv ) => {
  let supp1 = conv.parameters.number;
  conv.user.storage.supp1 = supp1;
  conv.ask("Très bien, c'est noté ! Et maintenant :");
  conv.ask("Quel est l'ordre de grandeur de votre CA annuel en milliers d'euros ?")
});

//renseignement supplémentaire 2
app.intent("renseigner_supp_2", ( conv ) => {
  let supp2 = conv.parameters.number;
  let supp1 = conv.user.storage.supp1;
  let id = Math.random().toString(26).slice(2);
  let user = conv.user.storage.user_email;
  writeInfosSupp (user, supp1, supp2, id);
  conv.ask("Parfait - ces informations sont désormais enregistrées sur votre profil");

  //redirections
  conv.ask(new Suggestions('Menu'));
  conv.ask(new Suggestions("Expert"));
  conv.ask(new Suggestions('Blog'));
});

// ---intents handlers par compétences---

//intents handlers pour RGPD
app.intent("rgpd_welcome", ( conv ) => {
  if(!conv.user.storage.pass_question){
    conv.user.storage.skill = "RGPD";
    conv.ask("Vous venez de choisir RGPD. "
    +"Veuillez poser une question à un expert ou cliquer sur une question "
    +"fréquemment posée :")
    conv.ask(new Suggestions("Poser une question"));
    conv.ask(new Suggestions("Qui est concerné?"));
    conv.ask(new Suggestions("Quelle mise en place?"));
    conv.ask(new Suggestions("Qui est responsable?"));
  } else {
    conv.followup("get_answer");
  }
});

//intents handlers pour Juridique
app.intent("juridique_welcome", ( conv ) => {
  conv.user.storage.skill = "Juridique";
  conv.ask("Nous sommes en recherche d'un partenaire qui voudrait "
  +"conseiller nos utilisateurs en matière juridique."
  +"Je vous prie de bien vouloir prendre contact avec nous"
  +" : myteleworker@gmail.com")
  //redirections
  conv.ask(new Suggestions('Menu'))
  conv.ask(new Suggestions("Expert"));
  conv.ask(new Suggestions('Blog'))
});

//intents handlers pour Financement
app.intent("financement_welcome", ( conv ) => {
  conv.user.storage.skill = "Financement";
  conv.ask("Nous sommes en recherche d'un partenaire qui voudrait "
  +"conseiller nos utilisateurs en matière de financement."
  +"Je vous prie de bien vouloir prendre contact avec nous"
  +" : myteleworker@gmail.com")
  //redirections
  conv.ask(new Suggestions('Menu'))
  conv.ask(new Suggestions("Expert"));
  conv.ask(new Suggestions('Blog'))
});

//intents handlers pour Assurances
app.intent("assurance_welcome", ( conv ) => {
  conv.user.storage.skill = "Assurances";
  conv.ask("Nous sommes en recherche d'un partenaire qui voudrait"
  +"conseiller nos utilisateurs en matière d'assurance."
  +"Je vous prie de bien vouloir prendre contact avec nous"
  +" : myteleworker@gmail.com")
  //redirections
  conv.ask(new Suggestions('Menu'))
  conv.ask(new Suggestions("Expert"));
  conv.ask(new Suggestions('Blog'))
});

//intents handlers pour Assurances
app.intent("marketing_welcome", ( conv ) => {
  conv.user.storage.skill = "Marketing";
  conv.ask("Nous sommes en recherche d'un partenaire qui voudrait"
  +"conseiller nos utilisateurs en matière de Marketing"
  +"Je vous prie de bien vouloir prendre contact avec nous"
  +" : myteleworker@gmail.com")
  //redirections
  conv.ask(new Suggestions('Menu'))
  conv.ask(new Suggestions("Expert"));
  conv.ask(new Suggestions('Blog'))
});


//contact de l'admin de la plateforme comme un expert 
// via la création d'un event hangout
app.intent("contact_admin", ( conv ) => {

    //date : now + 1 heure
    let date = new Date();
    let date1 = date
    let hours = date.getHours()
    date1.setHours( hours + 1 )
    let startDateTime = date.toISOString();  
    let endDateTime = date1.toISOString(); 

    //éléments de description et d'envoi du rendez-vous
    let summary = "Rendez-vous avec l'admin de MyTeleworker.com";
    let description = 'Un rendez-vous dans une heure';
    let user = conv.user.storage.user_email;
    let expert = admin_email;
    let mode = "visio";
    let theme = "contacter admin";
    let context = [conv.input.raw];

    //confirmation par le bot
    conv.ask("Votre rendez-vous a bien été enregistré "
    +" avec l'administrateur de MyTeleworker");
    conv.ask("Vous recevrez très prochainement un mail "
      + " pour accéder à une chat-room privée")

    //redirections
    conv.ask(new Suggestions('Menu'));
    conv.ask(new Suggestions("Expert"));
    conv.ask(new Suggestions('Blog'));


    //envoi du rendez-vous
    //et enregistrement dans Firebase
    insertEvents(jwtClient, startDateTime, endDateTime, 
      summary, description, user, expert, theme, context, mode)
})


app.intent("take_rdv", ( conv ) => {
  var skill = conv.parameters.skill
  conv.user.storage.pass_question = 0;
  
    if(!skill){
        conv.ask("Quelle compétence vous intéresse ?")

        //redirections
        conv.ask(new Suggestions("RGPD"));
        conv.ask(new Suggestions("Financement"));
        conv.ask(new Suggestions("Assurances"));
        conv.ask(new Suggestions("Juridique"));
        conv.ask(new Suggestions("Marketing")); 
    } else {
        let action = skill.toLowerCase();
        conv.followup(skill)
    }
})


app.intent("ask_expert", ( conv ) => {
  //l'utilisateur est passé par cette intent
  //on stocke cette information pour une redirection
  //plus tard dans les "welcome" intents par 
  //compétence puis dans la Fallback intent
  conv.user.storage.pass_question = 1;
  let theme = conv.user.storage.skill;
  conv.ask("Très bien");
  conv.ask("Quelle est votre question sur le thème " + theme + " ?");
})


app.intent("ask_expert_get_answer", ( conv ) => {

  return new Promise( function (resolve, reject) {
    firebase.database().ref("questions").orderByChild("milliseconds").limitToLast(3).on("value", function( snap ) {
      if(!snap.val()) {
        conv.user.storage.question = "non-renseigné";
        conv.ask("C'est noté !");
        conv.ask("Vous allez maintenant pouvoir choisir l'expert qui"
          + " répondra le mieux à votre demande");
        conv.ask(new Suggestions("Choisir un expert"));
        conv.ask(new Suggestions("Menu")); 
      resolve();
    } else {
      var data_obj = snap.val()
      var key;
      var user = conv.user.storage.user_email
      var last_question = [];
      var last_question_time = [];
      for(key in data_obj){
            if( user === data_obj[key].user){
              last_question.push(data_obj[key].question)
              last_question_time.push(data_obj[key].milliseconds)
            }
      }
      //avoir l'index du maximum des 3 dernières questions en base
      //prévenir ce cas : un même utilisateur demande successivement 
      //plusieurs questions
      //si bcp d'utilisateurs en même temps : augementer 3 vers 5 voire 10
      let i = last_question_time.indexOf(Math.max(...last_question_time));
      conv.user.storage.question = last_question[i] || "";
      conv.ask("C'est noté !");
      conv.ask("Vous allez maintenant pouvoir choisir l'expert qui"
        + " répondra le mieux à cette demande");
      conv.ask(new Suggestions("Choisir un expert"));
      conv.ask(new Suggestions("Menu")); 
      resolve();
    }
  });
  })
})

//intent handler pour l'intent de défaut ; la non-intent
//astuce : stocker le passage dans une intent puis
//vérifier ce passage dans la Fallback intent
//et rediriger si nécessaire vers la bonne intent
//même principe quand dans l'intent handle_permission'
//attention : le passage d'infos avec les followups
//est assez spécifique
app.intent("Default_Fallback_Intent", ( conv ) => {

  let id = Math.random().toString(26).slice(2);
  let question = conv.input.raw;
  let user = conv.user.storage.user_email;
  let date = new Date();
  let milliseconds = date.getTime(); 
  writeQuestion ( user, question, milliseconds, id )

  if(!conv.user.storage.pass_question){
    conv.ask("Ta question est pertinente, "
    +"mais je n'ai pas de réponse pour l'instant");
  conv.ask("J'envoie une notification au service pour remédier "
  +"à ce problème et ils t'enverront la réponse très rapidement");
  conv.ask(new Suggestions(`Menu`));
  conv.ask(new Suggestions("Expert"));
  conv.ask(new Suggestions("Blog"));
  let query = conv.query;
  let text = 'Question posée : ' + query + 
  " par : " +  conv.user.storage.user_email;
  let mailOptions = {
      from: email,
      to: email,
      subject: 'Intention par défaut du chatbot MyTeleworker',
      text: text
   };  
  sendMail(mailOptions);
  } else {
    conv.followup("get_answer")
  }
});

//export et écoute sur serveur
//création de l'action yourAction
//qui permet d'excéuter les handlers par intents
exports.yourAction = functions.https.onRequest(app);
express().use(bodyParser.json(), app).listen(3000);

// ---------------------------------------------------------------------------
//                    Fonctions Écriture dans Firebase
// ---------------------------------------------------------------------------


function writeQuestion ( user, question, milliseconds, id) {
  return firebase.database().ref('questions/' + id).set({
    user : user,
    question : question,
    milliseconds : milliseconds
  })
}

function writeReminder ( userID, user, intent) {
  return firebase.database().ref('reminders/' + userID).set({
    userID : userID,
    user : user,
    intent : intent
  })
}

function writeUser (user, firstname, lastname, adrr1, city, country, zip, id) {
  return firebase.database().ref('users').on('value', ( snap ) => {
    if(!snap.val()){
      return firebase.database().ref('users/' + id).set({
        firstname : firstname,
        lastname : lastname,
        email : user,
        adrr1 : adrr1,
        adrr2 : "",
        city : city,
        country : country,
        zip : zip
      });
    }else{
      var app = false;
      snap.forEach( ( childSnap ) => {
        let key = childSnap.key;
        let data = snap.val()[key];
        let email = data.email;
        if( email === user ){
          app = app || true;
          return firebase.database().ref('users/' + key).update({
            firstname : firstname,
            lastname : lastname,
            email : user,
            adrr1 : adrr1,
            adrr2 : "",
            city : city,
            country : country,
            zip : zip
          });
        }
      });
      if(!app){
        return firebase.database().ref('users/' + id).set({
          firstname : firstname,
          lastname : lastname,
          email : user,
          adrr1 : adrr1,
          adrr2 : "",
          city : city,
          country : country,
          zip : zip
        });
      }
    }
  })
}

function writeRendezVous (user, expert, date, theme, meeting, hangoutLink, shortLink, context, mode, id) {
  return firebase.database().ref('rdv/' + id).set({
        date : date,
        expert : expert,
        hangoutLink : hangoutLink,
        shortLink : shortLink,
        meeting : meeting,
        theme : theme,
        user : user,
        context : context,
        mode : mode
      });
}

function writeInfosSupp (user, supp1, supp2, id) {

  return firebase.database().ref('users').on('value', ( snap ) => {
    if(!snap.val()){
      return firebase.database().ref('users/' + id).set({
        email : user,
        supp1 : supp1,
        supp2 : supp2
      });
    } else {
      var app = false;
      snap.forEach( ( childSnap ) => {
        let key = childSnap.key;
        let data = snap.val()[key];
        let email = data.email;
        if( email === user ){
          app = app || true;
          return firebase.database().ref('users/' + key).update({
            email : user,
            supp1 : supp1,
            supp2 : supp2
          });
        }
      });
      if(!app){
        return firebase.database().ref('users/' + id).set({
          email : user,
          supp1 : supp1,
          supp2 : supp2
        });
      }
    }
  })
}


const grade = {'plus':1, 'equal':0, 'moins':-1};
//mise à jour de la note d'appréciation d'une intention sur DialogFlow
function writeFeedbackData ( matched_intent ) {
  var results = matched_intent.match(/("[^_]+"|[^_\s]+)/g);
  var score = grade[results[results.length-1]]
  var intent = results[0]+results[1]

  //lecture moyenne actuelle, calcul nouvelle moyenne et écriture valeur
  return firebase.database().ref('feedback/intents/' + intent).on('value', ( snap ) => {
    if(!snap.val()){
      let newAvgRating = score
      return firebase.database().ref('feedback/intents/' + intent).set({
        avgRating : newAvgRating,
        numRatings : 1
      });
    }else{
      // Compute new number of ratings
      let newNumRatings = snap.val().numRatings + 1;
      // Compute new average rating
      let oldRatingTotal = snap.val().avgRating * snap.val().numRatings;
      let newAvgRating = (oldRatingTotal + score) / newNumRatings;
      return firebase.database().ref('feedback/intents/' + intent).set({
        avgRating : newAvgRating,
        numRatings : newNumRatings 
      });
    }
  })
}


// ---------------------------------------------------------------------------
//                          Fonctions Calendar API
// ---------------------------------------------------------------------------


//fonction d'ajout d'un rendez-vous avec un expert via Calendar API
//enregistreament du lien du rendez-vous
function insertEvents(auth, startDateTime, endDateTime, 
  summary, description, user, expert, theme, context, mode) {
  const calendar = google.calendar({ version: 'v3', auth });
  var event = {
    summary: summary,
    description: description,
    start: {
      dateTime: startDateTime,
      timeZone: 'Europe/Paris'
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'Europe/Paris'
    },
    conferenceData: {
        createRequest: {requestId: "7qxalsvy0e"}
      },
    attendees: [{ email: user }, { email: expert }],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 60 },
        { method: 'email', minutes: 10 }
      ]
    }
  };
  calendar.events.insert(
    {
      auth: auth,
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1
    },
    function(err, event) {
      if (err) {
        console.log('There was an error contacting the Calendar service : ' + err);
        return;
      }
      var link = event.data.htmlLink;
      var hangoutLink = event.data.hangoutLink;
      var id = Math.random().toString(26).slice(2);

      //enregistrement du rdv entre user et experts sur Firebase

      var formData = {
        longDynamicLink : "https://myteleworker.page.link/?link=" + hangoutLink
      };

      request.post({url: "https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key="
          + api_key,
          form: formData }, function (err, httpResponse, body) {
            if(err){ console.log( err )}
            var res = JSON.parse(body);
            var shortUrl = res.shortLink;
            let str_context = context.toString();

            //écriture du rendez-vous dans Firebase
            writeRendezVous (user, expert, startDateTime, theme, 0, hangoutLink, shortUrl, str_context, mode, id);

            //mail pour l'utilisateur
            let mailOptionsUser = {
              from: email,
              to: user,
              subject: 'Rendez-vous avec un expert MyTeleworker.com',
              text: 'Le lien Hangout vers le rendez-vous : ' + shortUrl + '\n' 
              + "En cliquant sur ce lien, vous pouvez aussi accéder directement "
              +"à une chat-room privée avec l'expert en cliquant sur 'Join'." + '\n' 
              + "Un mode avec visio-conférence est aussi disponible."
            };
            //suppression des doublons
            var context_unique = [... new Set(context)];
            var text_context = "";
            for(var a = 0; a < context_unique.length ; a ++){
              text_context = ">> "+context_unique[a]+'\n'+text_context
            }
            //mail pour l'expert
            let mailOptionsExpert = {
              from: email,
              to: expert,
              subject: 'Rendez-vous avec un utilisateur de MyTeleworker.com',
              text: 'Le lien Hangout vers le rendez-vous : ' + shortUrl + '\n' 
              + "En cliquant sur ce lien, vous pouvez aussi accéder directement"
              +" à une chat-room privée avec l'utilisateur en cliquant sur 'Join'." +'\n' 
              + "Un mode avec visio-conférence est aussi disponible à tout moment."
              + " Voici les questions posées par l'utilisateur "
              +"au bot avant votre mise en relation : " +'\n'
              + text_context
            };
            sendMail(mailOptionsUser);
            sendMail(mailOptionsExpert);
            console.log('The event has been created with great success!') ;
          });
    }
  );
}

// ---------------------------------------------------------------------------
//                           Fonctions Diverses
// ---------------------------------------------------------------------------

const forbidden_keywords = ["actions","_actions","google","capability","screen",
                            "audio","input","media","browser"];

//vérifie si input contient un forbidden word
function checkInput( input, words ) {
 return words.some(word => new RegExp(word, "i").test(input));
}

//fonction qui sélectionne uniquement les éléments de tab qui ne contiennent pas de 
//substring dans le tableau forbidden_keywords
function cleanTab ( tab, forbidden_keywords ) {
  var results = [];
  for(var e = 0;e < tab.length;e++){
    let bool = checkInput(tab[e],forbidden_keywords)
    if (!bool){
      results.push(tab[e])
    }
  }
  return results
}

//liste des intentions et de leur correspondance en phrases plus développées
//à remplir par l'intégrateur - selon ce qui a été rajouté sur DialogFlow
const mapping = {"rgpd" : {"rgpd_how" : "Comment mettre en place la RGPD ?",
                           "rgpd_who" : "Qui est concerné par l'application du RGPD ?",
                           "rgpd_responsible_who" : "Qui est responsable du traitement ?",
                           "rgpd_how_carte" : "Mise en place - Cartographier les traitements des données", 
                           "rgpd_how_pilote" : "Mise en place - Désigner un pilote"},
                "financement" : {},
                "assurances" : {},
                "juridique" : {},
                "marketing" : {}}


//fonction de mapping des intentions vers leurs phrases
function mapTab ( tab, mapping ) {
  var results = [];
  var skills = Object.keys(mapping)
  for (var l = 0;l < skills.length;l ++){
    let intent = skills[l]
    let sub_intents = Object.keys(mapping[intent])
    for(var m = 0; m < tab.length ; m ++){
      for(var n = 0 ; n < sub_intents.length ; n ++){
        if ( checkInput( tab[m], [sub_intents[n]] ) ){
          results.push(mapping[intent][sub_intents[n]])
        }
      }
    }
  }
  return results
}

//fonction d'envoi de mail avec paramètres
function sendMail ( mailOptions ) {
  mailTransport.sendMail(mailOptions, ( error, info ) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    })
}

//fonction de sélection des n premiers couples clef-valeur d'un objet JS
function firstN( obj, n ) {
  return Object.keys(obj) //get the keys out
    .slice(0, n) //get the first N
    .reduce(function(memo, current) { //generate a new object out of them
      memo[current] = obj[current]
      return memo;
    }, {})
}

// ----------------------------------FIN----------------------------------------
