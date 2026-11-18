package model

import (
	"github.com/perses/shared/cue/common"
)

#hexColor: =~"^#(?:[0-9a-fA-F]{3}){1,2}$"

kind: "PriceBarChart"
spec: close({
	// Series label naming each bar, a local start time such as "2026-11-18 17:00". Default "start".
	categoryLabel?: string & =~"^[a-zA-Z_][a-zA-Z0-9_]*$"
	// Lowest band first; a bar takes the first band whose upTo (percent of the average) it does not
	// exceed. The last band normally has no upTo.
	bands?: [...close({
		upTo?: number
		color: #hexColor
		label: string & !=""
	})]
	average?: close({
		show?:  bool
		label?: string
	})
	// Darker bar and a background column for the hour holding now. Default true.
	highlightCurrent?: bool
	format?:           common.#format
	legend?:           common.#legend
})
