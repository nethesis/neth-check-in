## Neth Check-in

Client and Server for Nethesis partner meeting badges 2017

**Client Installation:**

- Install node, npm
- Install mysql
- Install phpmyadmin (https://wiki.nethserver.org/doku.php?id=phpmyadmin)
- Clone repository
- `npm install`
- `npm install -g grunt-cli`
- `config set neth-check-in service status enabled TCPPort 9000,8080 access green,red`
- `signal-event runlevel-adjust; signal-event firewall-adjust`
- Change $scope.ipServer var with the server location ip addr in app/scripts/controllers/main.js and 
- Replace socket url in app/index.html
- **Run** client: `grunt server`  in client directory

**Server Installation**

- Requires mysql and node already installed
- `npm install`
- Create database **nethcheckin** in https://ip/phpmyadmin log with mysql user and pass
- Import db/nethcheckin.sql 
- Modify config.js in config dir with database user and pass
- Export Atendees from csv report from eventbrite with: name surname status company
- Import csv file in `iscritti` table using phpmyadmin with:
 1. format CSV using LOAD DATA 
 2. skipping 1st line 
 3. Column separated with `,` 
 4. Column escaped and enclose with empty 
 5. Lines terminated with `auto` 
 6. Column name: ordine, nome, cognome, email, stato, agency
- Run server with` node server.js`