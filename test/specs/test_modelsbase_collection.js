describe("Unit tests for BC base collection class.", function() {
	var oldSiteHelper = undefined,
		siteToken = "123",
		rootUrl = "https://secure.businesscatalyst.com/";

	beforeEach(function() {
		oldSiteHelper = BCAPI.Helper.Site;		
		
		BCAPI.Mocks.Helper.Site(undefined, siteToken, rootUrl);
	});
	
	afterEach(function() {
		expect(oldSiteHelper).not.toBe(undefined);
		
		BCAPI.Helper.Site = oldSiteHelper;
	});
	
	it("Check correct collection instantiation.", function() {		
		var collection = new BCAPI.Mocks.Models.PersonCollection();
		
		expect(collection.model).toBe(BCAPI.Mocks.Models.PersonModel);
		expect(collection._defaultLimit).toBe(BCAPI.Config.Pagination.limit);
		expect(collection._defaultSkip).toBe(BCAPI.Config.Pagination.skip);
	});
	
	it("Check correct collect url.", function() {
		var person = new BCAPI.Mocks.Models.PersonModel();
		var collection = new BCAPI.Mocks.Models.PersonCollection();
		
		expect(collection.url()).toBe(person.urlRoot());
	});
	
	/**
	 * This method provides a test template for collection fetch.
	 * 
	 * @params {List} expectedItems A list of items containing person data.
	 * @param {Object} options Options required for filtering, ordering, pagination.
	 * @param {Integer} numQueryParams The total number of query params we expect api url to have.
	 * @param {Integer} options.skip The number of records we want to skip from data set.
	 * @param {Integer} options.limit The total number of records we want to include in data set.
	 * @param {String} options.order The order expression used.
	 */
	function _testCollectionFetchWithParams(expectedItems, numQueryParams, options) {
		var personModel = new BCAPI.Mocks.Models.PersonModel(),
			collection = new BCAPI.Mocks.Models.PersonCollection(), 
			callbackCalled = false;
		
		options = options || {};
		
		function successHandler(returnedCollection, response, options) {
			var idx = 0;
			
			returnedCollection.each(function(item) {
				var expectedItem = expectedItems[idx++];
				
				expect(item.get("firstName")).toBe(expectedItem.firstName);
				expect(item.get("lastName")).toBe(expectedItem.lastName);
			});
			
			callbackCalled = true;
		}
		
		spyOn($, "ajax").andCallFake(function(request) {
			var urlRoot = personModel.urlRoot(),
				expectedLimit = options.limit || BCAPI.Config.Pagination.limit,
				expectedSkip = options.skip || BCAPI.Config.Pagination.skip,
				expectedOrder = options.order,
				totalAnd = request.url.split("&").length;
			
			expect(request.url.substring(0, urlRoot.length + 1)).toBe(urlRoot + "?");
			expect(request.url).toContain("limit=" + expectedLimit);
			expect(request.url).toContain("skip=" + expectedSkip);
			
			if(expectedOrder) {
				expect(request.url).toContain("order=" + expectedOrder);
			} else {
				expect(request.url).not.toContain("order=");
			}
			
			expect(totalAnd).toBe(numQueryParams);			
			expect(request.type).toBe("GET");
			expect(request.dataType).toBe("json");
			expect(request.headers.Authorization).toBe(siteToken);
			
			request.success(expectedItems);
		});
		
		runs(function() {
			var fetchArgs = {success: successHandler};

			for(var key in options) {
				fetchArgs[key] = options[key];
			}
			
			collection.fetch(fetchArgs);
		});
		
		waitsFor(function() {
			return callbackCalled;
		}, "Success callback not called.", 50);		
	}
	
	it("Check correct collection fetch with default values..", function() {
		var expectedItems = [{"firstName": "John",
			  				  "lastName": "Doe"},
			  				 {"firstName": "Triple",
			  			      "lastName": "X"}];
		
		_testCollectionFetchWithParams(expectedItems, 2);
	});
	
	it("Check correct collection fetch pagination.", function() {
		var expectedItems = [{"firstName": "John",
							  "lastName": "Doe"}],
			options = {skip: 10, limit: 1};
							  
		_testCollectionFetchWithParams(expectedItems, 2, options);
	});
	
	it("Check correct collection fetch ordering.", function() {
		var expectedItems = [{"firstName": "Triple", "lastName": "X"},
		                     {"firstName": "John", "lastName": "Doe"}];
		
		options = {"order": "-lastName"};
		
		_testCollectionFetchWithParams(expectedItems, 3, options);
	});
});