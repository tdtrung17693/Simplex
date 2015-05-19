'use strict';

app.controller('simplexCtrl', ['$scope', function($scope){
	$scope.az = null;
	$scope.$watch('az', function () {
	});
	$scope.change = function () {
		$location.path('/result');
	}
	function getMatrixFromCond() {

	}

	function getCanonicalForm() {

	}
}]);