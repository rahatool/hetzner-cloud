# Hetzner Cloud API - JavaScript Client
A native JavaScript integration for the Hetzner cloud to easily manage your resources.

# Outline of APIs
- [Server](#server-api)
- [FloatingIP](#floatingip-api)
- [SSHKey](#sshkey-api)
- [Image](#image-api)
- [Volume](#volume-api)
- [Network](#network-api)
- [ISO](#iso-api)
- [Pricing](#pricing-api)
- [ServerType](#servertype-api)
- [Location](#location-api)
- [Datacenter](#datacenter-api)
- [Action](#action-api)

# Installation
## CDN
Import library from the ESM.SH CDN for fast and easy setup:
### In web browser
Simply include `hetzner-cloud` in your html `<header>` tag.
```html
<script type="module">
import * as hetznerAPI from "//esm.sh/gh/rahatool/hetzner-cloud";
</script>
```
### In web worker
In order to be able to use hetzner-cloud in web workers, you need to import the source file as an ES6 module using:
```javascript
import * as hetznerAPI from "//esm.sh/gh/rahatool/hetzner-cloud";
```
## NPM registry
Use the package manager npm to install hetzner-cloud.
```shell
$ npm install github:rahatool/hetzner-cloud
$ npm install npm:node-fetch
```
If you want to run examples in Node.js runtime environment, you need to add below lines of code at the top of them.
```javascript
import fetch from 'node-fetch';
global.fetch = fetch;
```
## Direct Download
Grab the [latest release](//github.com/rahatool/hetzner-cloud/archive/refs/heads/master.zip) file.

# Implemented APIs
First of all you have to register your api token. To obtain an api token go to your project on [Hetzner Cloud Console](//console.hetzner.cloud/projects) and navigate to access.
```typescript
import {setAccessToken, Server, FloatingIP, SSHKey, Image, Volume, Network, ISO, Pricing, ServerType, Location, Datacenter, Action} from "@raha.group/hetzner-cloud";

setAccessToken('your api token');
```
## Server API
### Skeleton of Server
```typescript
class Server {
	static getAll(options?: {status?: enum {initializing, starting, running, stopping, off, deleting, rebuilding, migrating, unknown}, sort?: enum {id, name, created}, name?: String, label_selector?: Array}}): AsyncGeneratorFunction<Server>;
	static get(identifier: Number): Promise<Server>;

	/*includes root_password
	@throws Error if placement_error*/
	save(): Promise<Server>;
	destroy(): Promise<Action>;

	metrics(options: {type: enum {cpu, disk, network}, start: String, end: String, step?: Number}): Promise<Object>;

	powerOn(): Promise<Action>;
	/*soft-reboot*/
	reboot(): Promise<Action>;
	/*Cuts power to a server and starts it again. This forcefully stops it without giving the server operating system time to gracefully stop. This may lead to data loss, it’s equivalent to pulling the power cord and plugging it in again. Reset should only be used when reboot does not work.*/
	reset(): Promise<Action>;
	shutdown(): Promise<Action>;	
	/*Cuts power to the server. This forcefully stops it without giving the server operating system time to gracefully stop. May lead to data loss, equivalent to pulling the power cord. Power off should only be used when shutdown does not work.*/
	powerOff(): Promise<Action>;
	
	resetPassword(): Promise<{root_password: String, action: Action}>;
	
	/*@throws Error if rescue_already_enabled.*/
	enableRescue(options?: {type?: enum {linux64, linux32, freebsd64}, ssh_keys?: Array}): Promise<{root_password: String, action: Action}>;
	/*@throws Error if rescue_already_disabled*/
	disableRescue(): Promise<Action>;
	
	createImage(options?: {description?: String, type?: enum {snapshot, backup}, labels?: Object}): Promise<{image: Image, action: Action}>;
	enableBackup(): Promise<Action>;
	disableBackup(): Promise<Action>;
	
	rebuild(options: {image: String}): Promise<{root_password: String, action: Action}>;
	/*@throws Error if server_not_stopped or invalid_server_type.*/
	changeType(options: {upgrade_disk: Boolean, server_type: String}): Promise<Action>;
	
	attachISO(options: {iso: String}): Promise<Action>;
	detachISO(): Promise<Action>;
	
	changeReverseDNS(options: {ip: String, dns_ptr: String}): Promise<Action>;
	
	changeProtection(options: {delete?: Boolean, rebuild?: Boolean}): Promise<Action>;
	
	requestConsole(): Promise<{wss_url: String, password: String, action: Action}>;
	
	attachToNetwork(options: {network: Number, ip?: String, alias_ips?: Array}): Promise<Action>;
	detachFromNetwork(options: {network: Number}): Promise<Action>;
	
	changeAliasIPs(options: {network, Number, alias_ips: Array}): Promise<Action>;

	actions(options?: {status: enum {running, success, error}, sort: enum {id, command, status, progress, started, finished}}): AsyncGeneratorFunction<Action>;
}
```

### Usage of Server
```typescript
// Create a Server
let resource = new Server;
resource.populate({
	name: String, 
	server_type: String, 
	start_after_create?: Boolean,
	image: String, 
	ssh_keys?: Array,
	volumes?: Array,
	networks?: Array,
	user_data?: String,
	labels?: Object,
	automount?: Boolean,
	location?: String,
	datacenter?: String,
});
await resource.save();

// Update a Server
let resource = new Server;
resource.populate({
	id: Number,
	name?: String,
	labels?: Object,
}).save();

// Delete a Server
let resource = await Server.get(id);
await resource.destroy();

// Get a Server
let resource = await Server.get(id);
// await resource.action(parameters);

// Get all Servers
for await (let resource of Server.getAll({name: 'test', label_selector: ['k', '!k', 'k in (v1,v2,v3)', 'k notin (v1,v2,v3)']})) {
	console.log(resource);
	for await (let action of resource.actions({status: 'error', sort: 'started:desc'})) {
		console.log(action);
	}
}
```

## FloatingIP API
### Skeleton of FloatingIP
```typescript
class FloatingIP {
	static getAll(options?: {sort?: enum {id, created}, label_selector?: String}): AsyncGeneratorFunction<FloatingIP>;
	static get(identifier: Number): Promise<FloatingIP>;

	save(): Promise<FloatingIP>;
	destroy(): Promise<Action>;
	
	assign(options?: {server: Number}): Promise<Action>;
	unassign(): Promise<Action>;
	changeReverseDNS(options?: {ip: String, dns_ptr: String}): Promise<Action>
	
	changeProtection(options: {delete?: Boolean}): Promise<Action>;
	actions(options?: {status: enum {running, success, error}, sort: enum {id, command, status, progress, started, finished}}): AsyncGeneratorFunction<Action>;
}
```

### Usage of FloatingIP
```typescript
// Create a FloatingIP
let resource = new FloatingIP;
resource.populate({
	type: enum {ipv4, ipv6},
	server?: Number,
	home_location?: String,
	description?: String,
	labels?: Object,
});
await resource.save();

// Update a FloatingIP
let resource = new FloatingIP;
resource.populate({
	id: Number,
	description?: String,
	labels?: Object
}).save();

// Delete a FloatingIP
let resource = await FloatingIP.get(id);
await resource.destroy();

// Get a FloatingIP
let resource = await FloatingIP.get(id);
// await resource.action(parameters);
```

## SSHKey API
### Skeleton of SSHKey
```typescript
class SSHKey {
	static getAll(options?: {sort?: enum {id, name}, name?: String, fingerprint?: String, label_selector?: String}): AsyncGeneratorFunction<SSHKey>;
	static get(identifier: Number): Promise<SSHKey>;
	
	save(): Promise<SSHKey>;
	destroy(): Promise<Void>;
}
```
### Usage of SSHKey
```typescript
// Create a SSHKey
let resource = new SSHKey;
resource.populate({
	name: String,
	public_key: String
});
await resource.save();

// Update a SSHKey
let resource = new SSHKey;
resource.populate({
	id: Number,
	name?: String,
	labels?: Object
}).save();

// Delete a SSHKey
let resource = await SSHKey.get(id);
await resource.destroy();

// Get a SSHKey
let resource = await SSHKey.get(id);
// await resource.action(parameters);
```

## Image API
### Skeleton of Image
```typescript
class Image {
	static getAll(options?: {sort?: enum {id, name, created}, type?: {system, snapshot, backup}, status?: {available, creating}, bound_to?: String, name?: String, label_selector?: String}): AsyncGeneratorFunction<Image>;
	static get(identifier: Number): Promise<Image>;

	/*@throws Error if request create image*/
	save(): Promise<Image>;
	destroy(): Promise<Action>;

	changeProtection(options: {delete?: Boolean}): Promise<Action>;

	actions(options?: {status: enum {running, success, error}, sort: enum {id, command, status, progress, started, finished}}): AsyncGeneratorFunction<Action>;
}
```

### Usage of Image
```typescript
// Note: The operation "Create an Image" is not available

// Update an Image
let resource = new Image;
resource.populate({
	id: Number,
	description?: String,
	type?, enum {snapshot},
	labels?: Object,
}).save();

// Delete an Image
let resource = await Image.get(id);
await resource.destroy();

// Get an Image
let resource = await Image.get(id);
// await resource.action(parameters);
```

## Volume API
### Skeleton of Volume
```typescript
class Volume {
	static getAll(options?: {status?: enum {available, creating}, sort: enum {id, name, created}, name?: String, label_selector?: String}): AsyncGeneratorFunction<Volume>;
	static get(identifier: Number): Promise<Volume>;
	
	save(): Promise<Volume>;
	destroy(): Promise<Action>;
	
	attach(options: {server: Number, automount?: Boolean}): Promise<Action>;
	detach(): Promise<Action>;
	resize(options: {size: Number}): Promise<Action>;

	changeProtection(options: {delete?: Boolean}): Promise<Action>;

	actions(options?: {status: enum {running, success, error}, sort: enum {id, command, status, progress, started, finished}}): AsyncGeneratorFunction<Action>;
}
```
### Usage of Volume
```typescript
// Create a Volume
let resource = new Volume;
resource.populate({
	size: Number,
	name: String,
	labels?: Object,
	automount?: Boolean,
	format?: String,
	location?: String,
	server?: Number
});
await resource.save();

// Update a Volume
let resource = new Volume;
resource.populate({
	id: Number,
	name: String,
	labels?: Object
}).save();

// Delete a Volume
let resource = await Volume.get(id);
await resource.destroy();

// Get a Volume
let resource = await Volume.get(id);
// await resource.action(parameters);
```

## Network API
### Skeleton of Network
```typescript
class Network {
	static getAll(options?: {name?: String, label_selector?: String}): AsyncGeneratorFunction<Network>;
	static get(identifier: Number): Promise<Network>;
	
	save(): Promise<Network>;
	destroy(): Promise<Action>;
	
	addSubnet(options: {type: String, ip_range?: String, network_zone?: String}): Promise<Action>;
	deleteSubnet(options: {ip_range: String}): Promise<Action>;
	addRoute(options: {destination: String, gateway, String}): Promise<Action>;
	deleteRoute(options: {destination: String, gateway: String}): Promise<Action>;
	changeIPRange(options: {ip_range: String}): Promise<Action>;

	changeProtection(options: {delete?: Boolean}): Promise<Action>;

	actions(options?: {status: enum {running, success, error}, sort: enum {id, command, status, progress, started, finished}}): AsyncGeneratorFunction<Action>;
}
```
### Usage of Network
```typescript
// Create a Network
let resource = new Network;
resource.populate({
	name: String,
	ip_range: String,
	labels?: Object,
	subnets?: Array,
	routes?: Array,
});
await resource.save();

// Update a Network
let resource = new Network;
resource.populate({
	id: Number,
	name?: String,
	labels?: Object,
}).save();

// Delete a Network
let resource = await Network.get(id);
await resource.destroy();

// Get a Network
let resource = await Network.get(id);
// await resource.action(parameters);
```

## ISO API
ISOs are Read-Only images of DVDs
### Skeleton of ISO
```typescript
class ISO {
	static getAll(options?: {name?: String}): AsyncGeneratorFunction<ISO>;
	static get(identifier: Number): Promise<ISO>;
}
```

## Pricing API
### Skeleton of Pricing
```typescript
class Pricing {
	static getAll(options?: {name?: String}): AsyncGeneratorFunction<Pricing>;
}
```

## ServerType API
### Skeleton of ServerType
```typescript
class ServerType {
	static getAll(options?: {name?: String}): AsyncGeneratorFunction<ServerType>;
	static get(identifier: Number): Promise<ServerType>;
}
```

## Location API
### Skeleton of Location
```typescript
class Location {
	static getAll(options?: {name?: String}): AsyncGeneratorFunction<Location>;
	static get(identifier: Number): Promise<Location>;
}
```

## Datacenter API
### Skeleton of Datacenter
```typescript
class Datacenter {
	static getAll(options?: {name?: String}): AsyncGeneratorFunction<Datacenter>;
	static get(identifier: Number): Promise<Datacenter>;
}
```

## Action API
### Skeleton of Action
```typescript
class Action {
	static getAll(options?: {status?: enum {running, success, error}, sort?: enum {id, command, status, progress, started, finished}}): AsyncGeneratorFunction<Action>;
	static get(identifier: Number): Promise<Action>;
}
```

# Supported Engines
This project has been tested and works on the following engines:
- Chrome (desktop & Android)
- Firefox
- Opera
- Safari 12+ (desktop & iOS)
- Node.js 10+

# License
This project by [Raha Group](//raha.group) is licensed under the [CC-BY-SA-4.0 License](//creativecommons.org/licenses/by-sa/4.0/).

# Resources
[Official Hetzner Cloud API documentation](//docs.hetzner.cloud/)

# Stay connected
Stay in touch with Raha’s community and keep track of development and community news by subscribing to the Raha’s [Blog](//raha.group) and [YouTube channel](//youtube.com/channel/UC0bWOBL-vMPCwT6nI9Cz1yw).

## Documentation
The official docs are a great place to discover new things.

## Issue Tracker
Are you experiencing problems with Raha? [report issues](//groups.google.com/d/forum/rahagroup) and find solutions to your problems here. 

## Feature Request
You are always welcome to ask for more features to be added to Raha.

## Events
Stay up to date with meetups, conferences and more.

## Support
Looking for help? please first check out the official (mentioned above) and unofficial (e.g. [Stack Overflow](//stackoverflow.com/questions/tagged/raha)) resources. If you are still experiencing problems, feel free to create a new issue.

# Donation
If you'd like Raha to grow even stronger, please become a sponsor today by donating via Paypal [![Donate][paypal-image]][paypal-url] *(Farnood)* to support Raha's ongoing maintenance and development of new functionality.

[paypal-image]: https://img.shields.io/badge/paypal-donate-brightgreen.svg
[paypal-url]: //paypal.com/cgi-bin/webscr?cmd=_donations&business=RZC8HCR5SPGQY&item_name=Contribute+to+Raha%27s+ongoing+maintenance+and+development&currency_code=USD&source=url