var swagger = {
};

function toSwagger(apidocJson, projectJson) {
	addBasicInformation(projectJson);
	addInfo(projectJson);
	createAPIOutput(apidocJson);
	return swagger;
}

var tagsRegex = /(<([^>]+)>)/ig;
// Removes <p> </p> tags from text
function removeTags(text) {
	return text ? text.replace(tagsRegex, "") : text;
}

function addBasicInformation(projectJson) {
	var splitUrl = projectJson.url.split("/");
	var host = splitUrl[0];
	splitUrl.shift();
	swagger = {
		swagger: "2.0",
		//host: host,
		basePath: "/" + splitUrl.join("/"),
		schemes: ["http"],
		info: {},
		paths: {},
		definitions: {}
	}
}

function addInfo(projectJson) {
	swagger.info = {
		title: projectJson.title || projectJson.name,
		version: projectJson.version,
		description: projectJson.description
	}
}

function createAPIOutput(apidocJson) {
	for (var apiPathIndex = 0; apiPathIndex < apidocJson.length; apiPathIndex++) {
		console.log(apidocJson[apiPathIndex].url);
		if (apidocJson[apiPathIndex].version !== "0.0.1") {
			createPathDefinitions(apidocJson[apiPathIndex]);
		}
	}
}

function createPathDefinitions(path) {
	//console.log(path);
	var currPath = {
		get: {
			summary: removeTags(path.description),
			produces: ['application/json'],
			parameters: createParameterFields(path.parameter && path.parameter.fields && path.parameter.fields.Parameter || []),
			responses: createResponseFields(path, path.name)
		}
	};

	swagger.paths[path.url] = currPath;
}

/**
 * Transforms the parameters of a apidoc json file to swagger specific json
 * @param {[{}]} parameters 
 * @param {string} topLevelRef definition of the top level (usually name)
 * @returns list of parameters that corresponds the names of apidoc to swagger
 */
function createParameterFields(parameters) {
	if (parameters.length == 0) {
		console.log("parameters is empty");
		return [];
	}

	console.log("creating params");
	var result = [];
	for (var index = 0; index < parameters.length; index++) {
		currField = {
			name: parameters[index].field,
			in: "query",
			required: parameters[index].optional,
			description: removeTags(parameters[index].description)
		};

		// does the parameter have a type
		if (parameters[index].type) {
			// special case for DateTime
			if (parameters[index].type === 'DateTime') {
				currField.type = "string";
				currField.format = "date-time";
			} else {
				currField.type = parameters[index].type.toLowerCase();
			}
		} else {
			// hardcoded for a special case
			currField.type = 'string';
		}
		result.push(currField);
	}
	console.log("created params");
	return result;
}

/**
 * 
 * @param {{}} path the object for the path
 * @param {string} topLevelRef the name of the current module
 * @returns The body of the response with success and error codes
 */
function createResponseFields(path, topLevelRef) {
	var response = createSuccessFields(path.success && path.success.fields && (path.success.fields["Success 200"] || path.success.fields.Return) || [], topLevelRef);
	addErrorFieldsToResponse(path.error && path.error.fields || [], response);
	return response;
}

/**
 * 
 * @param {[]} fields the Result array holding all successfull fields
 * @param {string} topLevelRef the name of the current "module"
 * @returns The response belonging in the `response` tag
 */
function createSuccessFields(fields, topLevelRef) {

	var result = {
		200: {
			description: 'Ok',
			schema: fields.length === 0 ? undefined : {
				$ref: '#/definitions/' + topLevelRef
			}
		}
	}

	console.log("creating definitions");
	for (var fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
		createDefinitions(fields[fieldIndex], topLevelRef);
	}
	console.log("created definitions");

	return result;
}

/**
 * Creates definitions for each field and stores them in swagger.definitions
 * @param {{}} field A return field
 * @param {string} topLevelRef the top level reference
 */
function createDefinitions(field, topLevelRef) {

	var splitFields = field.field.split(".");
	var fieldName = splitFields[splitFields.length - 1];
	if (splitFields.length > 1) {
		splitFields.pop();
		// modifying topLevelRef since we are in a subpath
		topLevelRef = splitFields.join(".");
	}

	currDefinition = swagger.definitions[topLevelRef] || { properties: {}, required: [] };

	var fieldType = field.type.toLowerCase().replace(/[^a-z]/g, '');

	// special cases for date time and if it's an object
	currDefinition.properties[fieldName] = {
		type: fieldType === 'datetime' || fieldType === 'cell' ? 'string' : fieldType,
		format: fieldType === 'datetime' ? 'date-time' : undefined,
		description: removeTags(field.description),
		$ref: fieldType === 'object' ? '#/definitions/' + field.field : undefined
	}

	if (!field.optional && currDefinition.required.indexOf(fieldName) === -1) {
		currDefinition.required.push(fieldName);
	}

	swagger.definitions[topLevelRef] = currDefinition;
}

errorStatus = {
	BadRequest: 400,
	Forbidden: 403,
	NotFound: 404,
	InternalServerError: 500,
	ServerBusy: 503,
}

/**
 * Creates error codes for the swagger file and adds them to the response body.
 * @param {[]} fields error fields from the apidoc JSON file
 * @param {{}} response the object where the response should be saved in
 */
function addErrorFieldsToResponse(fields, response) {
	Object.keys(fields).forEach(errorGroup => {
		fields[errorGroup].forEach(error => {
			if (errorStatus[error.field]) {
				response[errorStatus[error.field]] = {
					description: removeTags(error.description)
				};
			} else if(error.field.indexOf("NotFound") !== -1) {
				response["403"] = {
					description: removeTags(error.description)
				};
			}
		});
	});
}

module.exports = {
	toSwagger: toSwagger
};