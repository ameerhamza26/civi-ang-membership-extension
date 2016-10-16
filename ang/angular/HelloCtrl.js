(function(angular, $, _) {

  angular.module('angular').config(function($routeProvider) {
      $routeProvider.when('/currentmemberships', {
        controller: 'MembershipCtrl',
        templateUrl: '~/angular/HelloCtrl.html',

        // If you need to look up data when opening the page, list it out
        // under "resolve".
        resolve: {
          currentMemberships: function(CoreApi) {
            return CoreApi.get({})
          }
        }
      });
    }
  );

  // The controller uses *injection*. This default injects a few things:
  //   $scope -- This is the set of variables shared between JS and HTML.
  //   crmApi, crmStatus, crmUiHelp -- These are services provided by civicrm-core.
  angular.module('angular').controller('MembershipCtrl', function($scope, crmApi, crmStatus, crmUiHelp, currentMemberships, CoreApi) {
    // The ts() and hs() functions help load strings for this module.
    var ts = $scope.ts = CRM.ts('angular');
    var hs = $scope.hs = crmUiHelp({file: 'CRM/angular/HelloCtrl'}); // See: templates/CRM/angular/HelloCtrl.hlp

   $scope.date = {};
   $scope.memberships = currentMemberships;

    $scope.search = function() {
	if (checkError()) {
		$scope.error = "Please enter a start/end date";
	}		
	else {
		$scope.error = "";
		var params = {
  			"start_date": {">=":getDate($scope.date.start_date)},
  			"end_date": {"<=":getDate($scope.date.end_date)}
		}
		CoreApi.get(params)
		.then(function(res) {
			$scope.memberships = res;
		});
	}
 	
    };

	var getDate = function(_date) {
		var d = new Date(_date);
		var date = d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate();
		return date;
	}

	var checkError = function() {
		if (typeof $scope.date.start_date == "undefined" || typeof $scope.date.end_date == "undefined") {
			return true;
		}		
		else if ($scope.date.start_date == null || $scope.date.end_date == null){
			return true;
		}
		else {
			return false;
		}	
	}
  });

	angular.module('angular').service('CoreApi', function($q, crmApi) {
		this.get = function(params) {
			var defer = $q.defer();
			var memberships =[];
   			var contact_ids = [];
			crmApi('Membership', 'get', params)
			.then(function(res) {
				if (res.count == 0 )
				{
					defer.resolve(memberships)
				}
				else {
   					for (var i = 0; i<res.count; i++) {
						if (res.count ==1 ) {
							memberships.push({membership: res.values[res.id]});
							contact_ids.push(parseInt(res.values[res.id].contact_id));
						}
						else {
 							memberships.push({membership: res.values[i+1]});
							contact_ids.push(parseInt(res.values[i+1].contact_id));						
						}
   					}
					crmApi('Contact', 'get', {
  						"id": {"IN":contact_ids}
					}).then(function(result) {
						for (var j=0;j< result.count; j++)
						{
							memberships[j].contact = result.values[contact_ids[j]];
						}
						defer.resolve(memberships); 
					})
				}
			});
			return defer.promise;
		}
	});

})(angular, CRM.$, CRM._);
