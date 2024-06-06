let anyCaseToSnakeCase = value => value.replace(/[^a-zA-Z0-9]+/g, '_').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').replace(/([a-z])([A-Z])/g, '$1_$2').replace(/([0-9])([^0-9])/g, '$1_$2').replace(/([^0-9])([0-9])/g, '$1_$2').replace(/_+/g, '_').toLowerCase();
let checkFault = value => {
	let fault = value.error;
	if (fault) {
		let error = new Error;
		error.name = fault.code;
		error.message = fault.message;
		error.details = fault.details;
		throw error;
	}
};

let accessToken;
export function setAccessToken(APIToken) {
	accessToken = APIToken;
};

class Base {
	populate(elements) {
		return Object.assign(this, elements);
	}

	static endpoint = '';
	_collectionName(plural = true) {
		let {constructor} = this;
		return constructor.endpoint ? constructor.endpoint : anyCaseToSnakeCase(constructor.name) + (plural ? 's' : '');
	}
	_endpoint(action) {
		let endpoint = 'https://api.hetzner.cloud/v1/' + this._collectionName();
		if (Reflect.has(this, 'id')) {
			endpoint += '/' + this.id;
		}
		if (action) {
			endpoint += '/actions/' + action;
		}
		return endpoint;
	}
	async _fetch(endpoint, {query, body, headers = {}, ...options} = {}) {
		query = query ? '?' + new URLSearchParams(query) : '';
		headers['authorization'] = 'Bearer ' + accessToken;
		options.headers = headers;
		if (body) {
			options.body = JSON.stringify(body);
			headers['content-type'] = 'application/json';
		}
		let response = await fetch(endpoint + query, options);
		if (String(response.headers.get('content-type')).includes('json')) {
			let body = await response.json();
			checkFault(body);
			return body;
		} else {
			return await response.text();
		}
	}
	_paginatedSource(generator) {
		return async function*() {
			let pageToken = 1;
			do {
				let payload = await generator(pageToken);
				yield* payload.items;
				pageToken = payload.nextPageToken;
			} while (pageToken);
		}();
	}
	_paginatedFetch(generator, items, model) {
		return this._paginatedSource(async pageToken => {
			let response = await generator(pageToken);
			let {pagination} = response.meta;
			return {
				items: response[items].map(item => (new model).populate(item)),
				nextPageToken: pagination.next_page ? pageToken + 1 : 0,
				totalCount: pagination.total_entries,
			};
		});
	}
	toJSON() {
		return this;
	}

	static getAll(options = {}) {
		let self = this.prototype;
		return self._paginatedFetch(pageToken => {
			return self._fetch(self._endpoint(), {query: {per_page: 50, page: pageToken, ...options}});
		}, self._collectionName(), this);
	}
	static async get(identifier) {
		let instance = new this;
		instance.id = identifier;
		let response = await instance._fetch(instance._endpoint());
		return instance.populate(response[instance._collectionName(false)]);
	}
}
class Resource extends Base {
	constructor() {
		super();
		return new Proxy(this, {
			get(target, property) {
				if (Reflect.has(target, property) || property == 'then') {
					return Reflect.get(target, property);
				} else {
					return function(parameters) {
						return this._doAction(anyCaseToSnakeCase(property), parameters);
					};
				}
			}
		});
	}
	async _doAction(action, parameters) {
		let response = await this._fetch(this._endpoint(action), {method: 'POST', body: parameters});
		checkFault(response.action);
		response.action = (new Action).populate(response.action);
		return Object.keys(response).length == 1 ? response.action : response;
	}
	async save() {
		let response = await this._fetch(this._endpoint(), {method: Reflect.has(this, 'id') ? 'PUT' : 'POST', body: this});
		let {action, next_actions, [this._collectionName(false)]: resource, ...options} = response;
		this.populate(resource);
		this.populate(options);
		return this;
	}
	async destroy() {
		let response = await this._fetch(this._endpoint(), {method: 'DELETE'});
		let {action} = response;
		if (action) {
			return (new Action).populate(action);
		}
	}
	
	actions(options = {}) {
		let self = this.prototype;
		return self._paginatedFetch(pageToken => {
			return self._fetch(self._endpoint('actions'), {per_page: 50, page: pageToken, ...options});
		}, 'actions', Action);
	}
}

export class Server extends Resource {
	async metrics(options) {
		return (await this._fetch('metrics', {body: options, method: 'POST'})).metrics.time_series;
	}
	powerOn() {
		return this._doAction('poweron');
	}
	powerOff() {
		return this._doAction('poweroff');
	}
	changeReverseDNS(options) {
		return this._doAction('change_dns_ptr', options);
	}
	changeAliasIPs(options) {
		return this._doAction('change_alias_ips', options);
	}
}
export class FloatingIP extends Resource {
	changeReverseDNS(options) {
		return this._doAction('change_dns_ptr', options);
	}
}
export class SSHKey extends Resource {
}
export class Image extends Resource {
}
export class Volume extends Resource {
}
export class Network extends Resource {
}
export class ISO extends Base {
}
export class Pricing extends Base {
	static endpoint = 'pricing';
}
export class ServerType extends Base {
}
export class Location extends Base {
}
export class Datacenter extends Base {
}
export class Action extends Base {
}