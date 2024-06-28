# Beaver Architect Backend
Beaver Architect è un applicazione per la creazione mappe e mondi 3D generici che potranno essere convertite per qualsiasi piattaforma che supporti un mondo 3d grazie ad un convertitore o anche chiamato ingegnere.

## Struttura
Questa è la struttura generale di Beaver Architect 
- **Backend** - Dart
- **Frontend** - Dart (Flutter)
- **Database** - MongoDB
- **Ingineer** - dinamico (plugin)
### Librerie
Il backend di Beaver Architect è programmato in dart mediante anche l'uso di sue librerie inserite nel `pubspec.yaml`
- `http`, `shelf`, `shelf_io` - connessione e comunicazione con l'esterno
- `mongo_dart` - gestione del database MongoDB
### Definizioni e Nomi
Beaver Architect utilizza un sistema di nomi riferiti al contesto della costruzione per definire le componenti principali
- **Progetto** - il progetto è il cuore dell'applicazione, da qui sarà possibile definire tutte le proprietà del mondo
- **Architetto** - l'architetto si affianca al progetto per gestire le sue caratteristiche generali e gli ingenieri
- **Ingenieri** - l'ingeniere è un corpo esterno al backend che viene chiamato per creare fisicamente il mondo per una sua specifica piattaforma tramite i costruttori
- **Costruttori** - i costruttori si occupano di definire in modo specifico le forme e dimensioni di ogni elemento del progetto
- **Cantiere** - il cantiere è un processo che viene chiamato durante la costruzione del progetto da parte dell'ingeniere
### Struttura del Progetto
Il progetto è il cuore dell'applicazione, da esso ogni suo elemento lo concretizza in modo sempre più definito seguendo questo schema

`Project`
- `ProjectHttp` - connessione ai clienti
- `DatabeseProject` - salvataggio dei dati
- `Architect` - impostazioni generali
    - `Style` - stile generale del progetto
    - `[+] Engineer` - lista degli ingenieri abilitati
        - `EngineerPlugin` - plugin da cui deriva l'ingeniere
        - `{+, +} Settings` - impostazioni specifiche dell'ingeniere
- `Dimension` - grandezza e posizione del progetto
- `[+] Structure` - edificio, casa o palazzo
    - `[+] Layer` - piano della struttura
        - `[+] Room` - semplici stanze del layer
            - `Area` - definisce la forma della stanza
            - `Floor` - componente per il pavimento
            - `Floor` - componente per il soffitto
            - `[+] Wall` - muri della stanza
        - `[+] Wall` - semplici muri del layer
            - `Line` - definisce la struttura 2d del muro
            - `Area2D` - definisce la struttura 3d del muro

## Mondo 2D
Il mondo 2D è gestito da classi basiche all'interno di `world/world_2d.dart` di cui si trovano queste classi ciascuna che estende `JsonMappale` e possono essere sommati e sottratti tramite gli operatori + e -

`Pos2D` - posizione come x, z
```dart
final double x;
final double z;

Pos2D(this.x, this.z);

//Trova la posizione più piccola come x e z
static Pos2D findPos2D(List<Pos2D> poss);
```

`Size2D` - dimensione come width (x) e lenght (z)
```dart
final double width;
final double lenght;

Size2D(this.width, this.lenght);

//Trova la dimensione che contiene tutte a partire da una
static Size2D findSize2D(Pos2D pos, List<Pos2D> poss);
```

`Rotation2D` - rotazione secondo pi
```dart
final double y;

Rotation2D(this.y);
```

## Connessione
Il sistema di richieste e risposte http e comunicazione tra le varie parti di Beaver Architect è gestito dalle librerie `http`, `shelf` e `shelf_io` ed è diviso in 2 parti distinte
- **Connessione** `CommonHttp`
    - **Risposta** - `ServerConnectionHttp`
        - Server • Local Client - `ServerHttp`
        - Progetto • Multiple Client - `ProjectHttp`
    - **Richiesta** - `ConnectionHttp`
        - Engineer - `EngineerHttp`
        - Client - `ClientHttp`

Ognuna di queste classi estende `CommonHtttp` che presenta i seguenti costruttori e proprietà:
```dart
final String address;
int port;

CommonHttp(this.address, this.port);
CommonHttp.localhost(this.port);

bool get isLocal;
String get baseUrl;
```
### Risposta
Il `ServerHttp` accessibile dal `main.dart` è connesso ad un singolo client locale in funzione dell'applicazione, a questo si possono collegare più `ProjectHttp` in locale.
```dart
server.connect(projectHttp, prefix);
```
Oppure aprire il progetto su un altro indirizzo accessibile dall'esterno e a cui si possono collegare più client.
```dart
ProjectHttp projectHttp = ProjectHttp(name, address);
await projectHttp.open();
```
Per eseguire una funzione alla chiamata di una request esistono due mappe che presentano una chiave che indica il `path` della request e una funzione che verrà eseguita.
```dart
Map<String, Future<Response> Function(data)> listeners => {
    "/...": (data) async => Response.ok("...");
}
Map<String, Future<Response> Function(Request request)> requests => {
    "/...": (request) async => Response.ok("...");
}
```
La mappa `listeners` viene utilizzata quando la request è un `post` e contiene un `application/json` oppure è un `get` e `data` sarà una `Map<String, String>` dei parametri, in tutti gli altri casi viene chiamato `requests`.

Per inviare risposte si possono utilizzare due metodi all'interno di `ServerConnectionHttp`
```dart
Response ok(json); //solo per elementi json o JsonWritable
Response error(String message, {error, Stacktrace Stacktrace});
```
> NOTA: quando specifichi il `path` di una `request` metti sempre uno "/" davanti e quando invii una risposta assicurati che sia una `String` o `Stream` altrimenti utilizza il metodo `ok(json)`

### Richiesta
Per comunicare e ricevere dai dall'esterno all'interno delle classi di richiesta di solito esistono dei metodi `async` che svolgono già delle funzioni specifiche, altrimenti sarà necessario utilizzare i metodi `get` e `post`
```dart
Future get(String url, {Map<String, dynamic> args, valueOnFail});
//json è un tipo di json o JsonWritable
Future post(String url, json, {valueOnFail});
```
> NOTA: `url` non deve essere completo ma solamente la parte finale, per esempio se si vuole mandare una richiesta ad `http://localhost:8226/engineers/minecraft/build` passa come `url` solamente `engineers/minecraft/build`

## Database
Il database è MongoDB ed è gestito dalla libreria `mongo_dart`. Attraverso `MongoBeaver` viene creata una sua istanza `mongo` in `main.dart` che genera all'interno della cartella `Beaver Architect` il file `mongod.conf` e la cartella `data` che contiene tutti i dati di MongoDB. A `MongoBeaver` si affiancano diversi database che estendono la classe `Database`:
- `DatabaseBeaver` - `beaver`
    - `projects`
    - `plugins`
- `DatabaseProject` - `project-${project.name}`

`DatabaseBeaver` è unico e situato in `MongoBeaver` mentre i `DatabaseProject` sono multipli, contengono tutti i sottodati di un `project` e vengono aperti solo all'apertura del progetto da parte del client.

Per interagire in modo più semplice con le collezioni sono state inserite delle funzioni aggiuntive a `CollectionDb`:

Per ottenere documenti
```dart
Future<Map<String, dynamic>?> getById(ObjectId id);
Future<List<Map<String, dynamic>>> getByIds(List<ObjectId> ids, {Map<String, bool> sort});
Future<List<Map<String, dynamic>>> getAll({Map<String, bool> sort});
```
Per aggiungere documenti
```dart
Future<void> add(Savable savable);
Future<void> addAll(List<Savable> Savable);
```
Per modificare documenti, dove `ModifyConfig` si crea utilizzando una sua istanza: `modify` a cui si usano i seguenti metodi che ritornano un altro `ModifyConfig`
- **set**: imposta un determinato attributo
- **push**: aggiungi un valore ad una `List` o `Map`
- **pull**: rimuovi un valore da una `List` o `Map`
```dart
Future<void> modify(ObjectId id, ModifyConfig modify);
Future<void> modifyAll(List<ObjectId> ids, ModifyConfig modify);
```
Per eliminare documenti
```dart
Future<bool> delete(ObjectId id);
Future<int> deleteAll(List<ObjectId> ids);
```
> NOTA: questi metodi sono stati aggiunti alla classe `CollrctionDb`, pertanto non bisogna confondere `get` con `find`, `add` con `insert`, `modify` con `update` e `delete` con `remove`