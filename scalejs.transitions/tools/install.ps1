param($installPath, $toolsPath, $package, $project)

$project |
	Add-Paths "{
		'scalejs.transitions'	: 'Scripts/scalejs.transitions-$($package.Version)',
		'jQuery-ui-effects'		: 'Scripts/jquery-ui-1.10.0.effects'
	}" |
	Add-Shims "{ 
		'jQuery-ui-effects'		: { 
			deps : ['jQuery']
		}
	}" | 
	Add-ScalejsExtension 'scalejs.transitions' |
	Out-Null