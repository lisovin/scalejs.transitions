param($installPath, $toolsPath, $package, $project)

$project |
	Remove-Paths 'scalejs.transitions' |
	Remove-Shims 'jQuery-ui-effects' | 
	Remove-ScalejsExtension 'scalejs.transitions' |
	Out-Null
