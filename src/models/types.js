/**
 * @typedef {Object} CreateApplicationRequest
 * @property {string} timestamp
 * @property {string} emailAddress
 * @property {string} region
 * @property {string} city
 * @property {string} barangay
 * @property {string} referredBy
 * @property {string} firstName
 * @property {string} middleName
 * @property {string} lastName
 * @property {string} mobileNumber
 * @property {string} secondaryMobileNumber
 * @property {string} installationAddress
 * @property {string} landmark
 * @property {string} desiredPlan
 * @property {string} proofOfBilling
 * @property {string} governmentValidId
 * @property {string} secondGovernmentValidId
 * @property {string} houseFrontPicture
 * @property {string} termsAndConditionsAgreement
 * @property {string} firstNearestLandmark
 * @property {string} secondNearestLandmark
 * @property {string} applicablePromo
 * @property {string} documentPicture
 * @property {string} barangay1
 * @property {string} barangay2
 * @property {string} pictureofstatmentbillingfromotherprovider
 * @property {string} referrersAccountNumber
 * @property {string} applyingFor
 * @property {string} status
 * @property {string} visitBy
 * @property {string} visitWith
 * @property {string} visitWithOther
 * @property {string} remarks
 * @property {string} modifiedBy
 * @property {string} modifiedDate
 * @property {string} userEmail
 */

/**
 * @typedef {Object} CreateBillingDetailsRequest
 * @property {integer|string} accountNo
 * @property {string} dateInstalled
 * @property {string} fullName
 * @property {string} contactNumber
 * @property {string} emailAddress
 * @property {string} address
 * @property {string} location
 * @property {string} plan
 * @property {string} provider
 * @property {number|string} accountBalance
 * @property {string} balanceUpdateDate
 * @property {string} username
 * @property {string} connectionType
 * @property {string} routerModemSn
 * @property {string} ip
 * @property {string} lcp
 * @property {string} nap
 * @property {string} port
 * @property {string} vlan
 * @property {string} lcpNap
 * @property {string} status
 * @property {string} group
 * @property {integer|string} splynxId
 * @property {integer|string} mikrotikId
 * @property {string} modifiedBy
 * @property {string} modifiedDate
 * @property {string} userEmail
 * @property {integer|string} billingDay
 * @property {string} billingStatus
 * @property {string} deliveryStatus
 * @property {string} routerModel
 * @property {string} barangay
 * @property {string} city
 * @property {string} region
 * @property {string} lcpNapPort
 * @property {string} usageType
 * @property {string} renter
 * @property {string} attachment1
 * @property {string} attachment2
 * @property {string} attachment3
 * @property {string} referredBy
 * @property {string} secondContactNumber
 * @property {string} addressCoordinates
 * @property {string} referrersAccountNumber
 */

/**
 * @typedef {Object} CreateJobOrderRequest
 * @property {string} emailAddress
 * @property {string} referredBy
 * @property {string} firstName
 * @property {string} middleInitial
 * @property {string} lastName
 * @property {string} contactNumber
 * @property {string} applicantEmailAddress
 * @property {string} address
 * @property {string} location
 * @property {string} barangay
 * @property {string} city
 * @property {string} region
 * @property {integer|string} planId
 * @property {string} remarks
 * @property {string} installationFee
 * @property {string} contractTemplate
 * @property {string} billingDay
 * @property {string} preferredDay
 * @property {string} joRemarks
 * @property {string} status
 * @property {string} verifiedBy
 * @property {string} modemRouterSN
 * @property {string} provider
 * @property {integer|string} lcpId
 * @property {integer|string} napId
 * @property {string} portId
 * @property {integer|string} vlanId
 * @property {string} username
 * @property {string} visitBy
 * @property {string} visitWith
 * @property {string} visitWithOther
 * @property {string} onsiteStatus
 * @property {string} onsiteRemarks
 * @property {string} modifiedBy
 * @property {string} modifiedDate
 * @property {string} contractLink
 * @property {string} connectionType
 * @property {string} assignedEmail
 * @property {string} setupImage
 * @property {string} speedtestImage
 * @property {string} startTimeStamp
 * @property {string} endTimeStamp
 * @property {string} duration
 * @property {string} externalId
 * @property {string} lcpnapId
 * @property {string} billingStatus
 * @property {string} routerModel
 * @property {string} dateInstalled
 * @property {string} clientSignature
 * @property {string} ip
 * @property {string} signedContractImage
 * @property {string} boxReadingImage
 * @property {string} routerReadingImage
 * @property {string} usernameStatus
 * @property {string} lcpnapportId
 * @property {string} itemName1
 * @property {string} itemQuantity1
 * @property {string} itemName2
 * @property {string} itemQuantity2
 * @property {string} itemName3
 * @property {string} itemQuantity3
 * @property {string} itemName4
 * @property {string} itemQuantity4
 * @property {string} itemName5
 * @property {string} itemQuantity5
 * @property {string} itemName6
 * @property {string} itemQuantity6
 * @property {string} itemName7
 * @property {string} itemQuantity7
 * @property {string} itemName8
 * @property {string} itemQuantity8
 * @property {string} itemName9
 * @property {string} itemQuantity9
 * @property {string} itemName10
 * @property {string} itemQuantity10
 * @property {string} usageType
 * @property {string} renter
 * @property {string} installationLandmark
 * @property {string} statusRemarks
 * @property {string} portLabelImage
 * @property {string} secondContactNumber
 * @property {string} accountNo
 * @property {string} addressCoordinates
 * @property {string} referrersAccountNumber
 * @property {string} applicationId
 * @property {string} applicationIdValue
 * @property {string} choose_Plan
 * @property {string} preferred_Day
 * @property {string} verified_By
 * @property {string} houseFront
 * @property {string} timestamp
 * @property {string} lcnap
 * @property {string} lcp
 * @property {string} lcpnapport
 * @property {string} nap
 * @property {string} port
 * @property {string} vlan
 * @property {string} plan
 * @property {Object} [lcpNavigation]
 * @property {Object} [napNavigation]
 * @property {Object} [vlanNavigation]
 * @property {string} [rowVersion]
 * @property {integer|string|null} createdBy
 * @property {string|null} createdDate
 */

/**
 * @typedef {Object} CreateLcpnapportRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} createdBy
 * @property {string} createdDate
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} CreateLcpnapRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} createdBy
 * @property {string} createdDate
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} CreateLcpRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} createdBy
 * @property {string} createdDate
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} CreateNapRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} createdBy
 * @property {string} createdDate
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} CreatePlanRequest
 * @property {string} name
 * @property {string} description
 * @property {number|string} amount
 * @property {integer|string} discountId
 * @property {integer|string} createdBy
 * @property {string} createdDate
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} CreatePortsRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} createdBy
 * @property {string} createdDate
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} CreateRouterRequest
 * @property {string} name
 * @property {string} description
 * @property {string} brand
 * @property {string} model
 * @property {integer|string} createdBy
 * @property {string} createdDate
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} CreateVlanRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} createdBy
 * @property {string} createdDate
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} UpdateApplicationRequest
 * @property {string} emailAddress
 * @property {string} region
 * @property {string} city
 * @property {string} barangay
 * @property {string} referredBy
 * @property {string} firstName
 * @property {string} middleName
 * @property {string} lastName
 * @property {string} mobileNumber
 * @property {string} secondaryMobileNumber
 * @property {string} installationAddress
 * @property {string} landmark
 * @property {string} desiredPlan
 * @property {string} proofOfBilling
 * @property {string} governmentValidId
 * @property {string} secondGovernmentValidId
 * @property {string} houseFrontPicture
 * @property {string} termsAndConditionsAgreement
 * @property {string} firstNearestLandmark
 * @property {string} secondNearestLandmark
 * @property {string} applicablePromo
 * @property {string} documentPicture
 * @property {string} barangay1
 * @property {string} barangay2
 * @property {string} pictureofstatmentbillingfromotherprovider
 * @property {string} referrersAccountNumber
 * @property {string} applyingFor
 * @property {string} status
 * @property {string} visitBy
 * @property {string} visitWith
 * @property {string} visitWithOther
 * @property {string} remarks
 * @property {string} modifiedBy
 * @property {string} modifiedDate
 * @property {string} userEmail
 */

/**
 * @typedef {Object} UpdateBillingDetailsRequest
 * @property {integer|string} accountNo
 * @property {string} dateInstalled
 * @property {string} fullName
 * @property {string} contactNumber
 * @property {string} emailAddress
 * @property {string} address
 * @property {string} location
 * @property {string} plan
 * @property {string} provider
 * @property {number|string} accountBalance
 * @property {string} balanceUpdateDate
 * @property {string} username
 * @property {string} connectionType
 * @property {string} routerModemSn
 * @property {string} ip
 * @property {string} lcp
 * @property {string} nap
 * @property {string} port
 * @property {string} vlan
 * @property {string} lcpNap
 * @property {string} status
 * @property {string} group
 * @property {integer|string} splynxId
 * @property {integer|string} mikrotikId
 * @property {string} modifiedBy
 * @property {string} modifiedDate
 * @property {string} userEmail
 * @property {integer|string} billingDay
 * @property {string} billingStatus
 * @property {string} deliveryStatus
 * @property {string} routerModel
 * @property {string} barangay
 * @property {string} city
 * @property {string} region
 * @property {string} lcpNapPort
 * @property {string} usageType
 * @property {string} renter
 * @property {string} attachment1
 * @property {string} attachment2
 * @property {string} attachment3
 * @property {string} referredBy
 * @property {string} secondContactNumber
 * @property {string} addressCoordinates
 * @property {string} referrersAccountNumber
 */

/**
 * @typedef {Object} UpdateJobOrderRequest
 * @property {string} emailAddress
 * @property {string} referredBy
 * @property {string} firstName
 * @property {string} middleInitial
 * @property {string} lastName
 * @property {string} contactNumber
 * @property {string} applicantEmailAddress
 * @property {string} address
 * @property {string} location
 * @property {string} barangay
 * @property {string} city
 * @property {string} region
 * @property {integer|string} planId
 * @property {string} remarks
 * @property {string} installationFee
 * @property {string} contractTemplate
 * @property {string} billingDay
 * @property {string} preferredDay
 * @property {string} joRemarks
 * @property {string} status
 * @property {string} verifiedBy
 * @property {string} modemRouterSN
 * @property {string} provider
 * @property {integer|string} lcpId
 * @property {integer|string} napId
 * @property {string} portId
 * @property {integer|string} vlanId
 * @property {string} username
 * @property {string} visitBy
 * @property {string} visitWith
 * @property {string} visitWithOther
 * @property {string} onsiteStatus
 * @property {string} onsiteRemarks
 * @property {string} modifiedBy
 * @property {string} modifiedDate
 * @property {string} contractLink
 * @property {string} connectionType
 * @property {string} assignedEmail
 * @property {string} setupImage
 * @property {string} speedtestImage
 * @property {string} startTimeStamp
 * @property {string} endTimeStamp
 * @property {string} duration
 * @property {string} externalId
 * @property {string} lcpnapId
 * @property {string} billingStatus
 * @property {string} routerModel
 * @property {string} dateInstalled
 * @property {string} clientSignature
 * @property {string} ip
 * @property {string} signedContractImage
 * @property {string} boxReadingImage
 * @property {string} routerReadingImage
 * @property {string} usernameStatus
 * @property {string} lcpnapportId
 * @property {string} itemName1
 * @property {string} itemQuantity1
 * @property {string} itemName2
 * @property {string} itemQuantity2
 * @property {string} itemName3
 * @property {string} itemQuantity3
 * @property {string} itemName4
 * @property {string} itemQuantity4
 * @property {string} itemName5
 * @property {string} itemQuantity5
 * @property {string} itemName6
 * @property {string} itemQuantity6
 * @property {string} itemName7
 * @property {string} itemQuantity7
 * @property {string} itemName8
 * @property {string} itemQuantity8
 * @property {string} itemName9
 * @property {string} itemQuantity9
 * @property {string} itemName10
 * @property {string} itemQuantity10
 * @property {string} usageType
 * @property {string} renter
 * @property {string} installationLandmark
 * @property {string} statusRemarks
 * @property {string} portLabelImage
 * @property {string} secondContactNumber
 * @property {string} accountNo
 * @property {string} addressCoordinates
 * @property {string} referrersAccountNumber
 * @property {string} applicationId
 * @property {string} houseFront
 * @property {integer|string|null} createdBy
 * @property {string|null} createdDate
 */

/**
 * @typedef {Object} UpdateLcpnapportRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} UpdateLcpnapRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} UpdateLcpRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} UpdateNapRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} UpdatePlanRequest
 * @property {string} name
 * @property {string} description
 * @property {number|string} amount
 * @property {integer|string} discountId
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} UpdatePortRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} UpdateRouterRequest
 * @property {string} name
 * @property {string} description
 * @property {string} brand
 * @property {string} model
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} UpdateVlanRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} CreateAccessLevelRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} createdBy
 * @property {string} createdDate
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} UpdateAccessLevelRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} CreateAccesslevelMenuRequest
 * @property {integer|string} menu_id
 * @property {integer|string} accesslevel_id
 */

/**
 * @typedef {Object} UpdateAccesslevelMenuRequest
 * @property {integer|string} menu_id
 * @property {integer|string} accesslevel_id
 */

/**
 * @typedef {Object} CreateBarangayRequest
 * @property {string} name
 * @property {string} city
 */

/**
 * @typedef {Object} UpdateBarangayRequest
 * @property {string} name
 * @property {string} city
 */

/**
 * @typedef {Object} CreateMenuRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} createdBy
 * @property {string} createdDate
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} UpdateMenuRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} LoginRequest
 * @property {string} username
 * @property {string} password
 */

/**
 * @typedef {Object} RequestPasswordResetRequest
 * @property {string} username
 */

/**
 * @typedef {Object} ResetPasswordRequest
 * @property {string} token
 * @property {string} newPassword
 */

/**
 * @typedef {Object} BillingStatus
 * @property {integer|string} id
 * @property {string} statusName
 * @property {string} modifiedDate
 * @property {integer|string} modifiedBy
 */

/**
 * @typedef {Object} InvoiceDto
 * @property {integer|string} id
 * @property {string} accountNo
 * @property {string} invoiceNo
 * @property {string} invoiceDate
 * @property {string} fullName
 * @property {string} contactNumber
 * @property {string} emailAddress
 * @property {string} address
 * @property {string} location
 * @property {string} plan
 * @property {number|string} invoiceBalance
 * @property {number|string} othersandBasicCharges
 * @property {number|string} totalAmount
 * @property {number|string} receivedPayment
 * @property {string} dateProcessed
 * @property {string} processedBy
 * @property {string} dueDate
 * @property {string} invoiceStatus
 * @property {string} emailStatus
 * @property {string} smsStatus
 * @property {string} paymentMethod
 * @property {string} referenceNo
 * @property {string} orNo
 * @property {string} modifiedBy
 * @property {string} modifiedDate
 * @property {string} userEmail
 * @property {string} transactionID
 * @property {string} barangay
 * @property {string} city
 */


/**
 * @typedef {Object} CreateServiceOrderRequest
 * @property {string|null} createdDate
 * @property {string|null} accountNumber
 * @property {string|null} dateInstalled
 * @property {string|null} fullName
 * @property {string|null} contactNumber
 * @property {string|null} emailAddress
 * @property {string|null} address
 * @property {string|null} plan
 * @property {string|null} provider
 * @property {string|null} username
 * @property {string|null} connectionType
 * @property {string|null} routerModemSN
 * @property {string|null} lcp
 * @property {string|null} nap
 * @property {string|null} port
 * @property {string|null} vlan
 * @property {string|null} supportStatus
 * @property {string|null} concern
 * @property {string|null} connectionRemarks
 * @property {string|null} priorityLevel
 * @property {string|null} visitStatus
 * @property {string|null} visitBy
 * @property {string|null} visitWith
 * @property {string|null} visitWithOthers
 * @property {string|null} visitRemarks
 * @property {string|null} modifiedBy
 * @property {string|null} modifiedDate
 * @property {string|null} userEmail
 * @property {string|null} requestedBy
 * @property {string|null} assignedEmail
 * @property {string|null} startTimestamp
 * @property {string|null} stopTimestamp
 * @property {string|null} duration
 * @property {string|null} repairCategory
 * @property {string|null} newRouterModemSN
 * @property {string|null} newLCP
 * @property {string|null} newNAP
 * @property {string|null} newPORT
 * @property {string|null} newVLAN
 * @property {string|null} routerModel
 * @property {string|null} clientSignature
 * @property {string|null} newPLAN
 * @property {string|null} supportRemarks
 * @property {string|null} pulloutRemarks
 * @property {string|null} pulloutRouterModel
 * @property {string|null} pulloutRouterModelSN
 * @property {string|null} pulloutCPESN
 * @property {string|null} itemName
 * @property {integer|string|null} itemQuantity
 * @property {string|null} itemName1
 * @property {integer|string|null} itemQuantity1
 * @property {string|null} itemName2
 * @property {integer|string|null} itemQuantity2
 * @property {string|null} itemName3
 * @property {integer|string|null} itemQuantity3
 * @property {string|null} itemName4
 * @property {integer|string|null} itemQuantity4
 * @property {string|null} itemName5
 * @property {integer|string|null} itemQuantity5
 * @property {string|null} itemName6
 * @property {integer|string|null} itemQuantity6
 * @property {string|null} itemName7
 * @property {integer|string|null} itemQuantity7
 * @property {string|null} itemName8
 * @property {integer|string|null} itemQuantity8
 * @property {string|null} itemName9
 * @property {integer|string|null} itemQuantity9
 * @property {string|null} itemName10
 * @property {integer|string|null} itemQuantity10
 * @property {string|null} image1
 * @property {string|null} image2
 * @property {string|null} image3
 * @property {number|string|null} serviceCharge
 * @property {string|null} barangay
 * @property {string|null} city
 * @property {string|null} addressCoordinates
 * @property {string|null} houseFrontPicture
 * @property {string|null} techModifiedDate
 * @property {string|null} assignedBy
 * @property {string|null} assignedDate
 */

/**
 * @typedef {Object} UpdateServiceOrderRequest
 * @property {string|null} createdDate
 * @property {string|null} accountNumber
 * @property {string|null} dateInstalled
 * @property {string|null} fullName
 * @property {string|null} contactNumber
 * @property {string|null} emailAddress
 * @property {string|null} address
 * @property {string|null} plan
 * @property {string|null} provider
 * @property {string|null} username
 * @property {string|null} connectionType
 * @property {string|null} routerModemSN
 * @property {string|null} lcp
 * @property {string|null} nap
 * @property {string|null} port
 * @property {string|null} vlan
 * @property {string|null} supportStatus
 * @property {string|null} concern
 * @property {string|null} connectionRemarks
 * @property {string|null} priorityLevel
 * @property {string|null} visitStatus
 * @property {string|null} visitBy
 * @property {string|null} visitWith
 * @property {string|null} visitWithOthers
 * @property {string|null} visitRemarks
 * @property {string|null} modifiedBy
 * @property {string|null} modifiedDate
 * @property {string|null} userEmail
 * @property {string|null} requestedBy
 * @property {string|null} assignedEmail
 * @property {string|null} startTimestamp
 * @property {string|null} stopTimestamp
 * @property {string|null} duration
 * @property {string|null} repairCategory
 * @property {string|null} newRouterModemSN
 * @property {string|null} newLCP
 * @property {string|null} newNAP
 * @property {string|null} newPORT
 * @property {string|null} newVLAN
 * @property {string|null} routerModel
 * @property {string|null} clientSignature
 * @property {string|null} newPLAN
 * @property {string|null} supportRemarks
 * @property {string|null} pulloutRemarks
 * @property {string|null} pulloutRouterModel
 * @property {string|null} pulloutRouterModelSN
 * @property {string|null} pulloutCPESN
 * @property {string|null} itemName
 * @property {integer|string|null} itemQuantity
 * @property {string|null} itemName1
 * @property {integer|string|null} itemQuantity1
 * @property {string|null} itemName2
 * @property {integer|string|null} itemQuantity2
 * @property {string|null} itemName3
 * @property {integer|string|null} itemQuantity3
 * @property {string|null} itemName4
 * @property {integer|string|null} itemQuantity4
 * @property {string|null} itemName5
 * @property {integer|string|null} itemQuantity5
 * @property {string|null} itemName6
 * @property {integer|string|null} itemQuantity6
 * @property {string|null} itemName7
 * @property {integer|string|null} itemQuantity7
 * @property {string|null} itemName8
 * @property {integer|string|null} itemQuantity8
 * @property {string|null} itemName9
 * @property {integer|string|null} itemQuantity9
 * @property {string|null} itemName10
 * @property {integer|string|null} itemQuantity10
 * @property {string|null} image1
 * @property {string|null} image2
 * @property {string|null} image3
 * @property {number|string|null} serviceCharge
 * @property {string|null} barangay
 * @property {string|null} city
 * @property {string|null} addressCoordinates
 * @property {string|null} houseFrontPicture
 * @property {string|null} techModifiedDate
 * @property {string|null} assignedBy
 * @property {string|null} assignedDate
 */

/**
 * A single audit trail / error log row.
 *
 * The API declares no response schema for /api/LogTrail or /api/LogError, so
 * this mirrors the live payload. Every row comes back with `id: 0` — the logs
 * carry no addressable key, which is why the screens are browse-only.
 *
 * @typedef {Object} LogEntry
 * @property {integer} id
 * @property {string} userId
 * @property {string} userName
 * @property {string} action
 * @property {string} entity
 * @property {string} entityId
 * @property {string} ipAddress
 * @property {string} userAgent
 * @property {string} requestMethod
 * @property {string} requestPath
 * @property {string} requestBody
 * @property {string} responseStatus
 * @property {string} timestamp
 * @property {string} description
 * @property {integer|null} createdBy
 * @property {string|null} createdDate
 */

/**
 * @typedef {Object} DiscountTypeDto
 * @property {integer|string} id
 * @property {string} name
 * @property {string} description
 * @property {string|null} startDate
 * @property {string|null} endDate
 * @property {integer|string} planId
 * @property {boolean} isActive
 * @property {number|string|null} amount
 * @property {string|null} createdDate
 * @property {string} createdBy
 */

/**
 * @typedef {Object} DiscountDto
 * @property {integer|string} id
 * @property {string|null} fullName
 * @property {string|null} contactNumber
 * @property {string|null} emailAddress
 * @property {string|null} address
 * @property {string|null} location
 * @property {string|null} plan
 * @property {string|null} provider
 * @property {string|null} discountId
 * @property {string|null} discountAmount
 * @property {string|null} discountStatus
 * @property {string|null} usedDate
 * @property {string|null} processedBy
 * @property {string|null} processDate
 * @property {string|null} approvedBy
 * @property {string|null} modifiedBy
 * @property {string|null} modifiedDate
 * @property {string|null} userEmail
 * @property {string|null} invoiceUsed
 * @property {string|null} remarks
 * @property {string|null} remaining
 * @property {string|null} barangay
 * @property {string|null} city
 * @property {string|null} createdDate
 * @property {string|null} createdBy
 * @property {integer|string|null} discounttype_id
 * @property {string|null} accountNo
 */
