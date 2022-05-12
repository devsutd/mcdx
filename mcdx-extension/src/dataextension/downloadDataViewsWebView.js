module.exports = {
    getWebView() {
        return `
        <html>

        <head>
            <title>Title</title>
            <meta charset="utf-8">
            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
            <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
            <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>
            <script>
                const vscode = acquireVsCodeApi();
                function submit(){
                    var dvs=[];
                    $(".dv_enable:checked").each(function () {
                        var dv = $(this).attr("value");
                        var amount = $("#__number__"+dv).val();
                        var ent = $("#__ent__"+dv).is(':checked');
                        var obj = {
                            dv: dv,
                            amount: amount,
                            ent: ent,
                        }
                        dvs.push(obj);
                    });
                    vscode.postMessage({
                        dvs: dvs,
                    })
                }
            </script>
        </head>
        
        <body style="background-color:#1E1E1E; color:white" onload="createQAButtonRefresh()">
            <div class="container">
                <div class="row">
                    <h1 class="col text-center">Data Views</h1>
                </div>
                <div class="row">
                    <label class="col-4">
                        Data Views 
                    </label>
                    <label class="col-5">
                        Record Amounts
                    </label>
                </div>
                <br/>
                    <div class="row">
						<div class="col-4">
                            <input class="pb-2 dv_enable" type="checkbox" id="__checkbox__Bounce" name="dataViewsInput" value="Bounce">
                            <label class="pb-2" for="__checkbox__Bounce">Bounce</label>
                        </div>
                        <div class="col-5">
                            <input class="mb-2" type="number" id="__number__Bounce" name="dataViewsInput" value="5000">
                            
                        </div>
                        <div class="col-3">
                            <label class="pb-2" for="__ent__Bounce">ENT</label>
                            <input class="pb-2 ent" type="checkbox" id="__ent__Bounce" name="entInput">
                        </div>
					</div>
                    <div class="row">
						<div class="col-4">
                            <input class="pb-2 dv_enable" type="checkbox" id="__checkbox__BusinessUnitUnsubscribes" name="dataViewsInput" value="BusinessUnitUnsubscribes">
                            <label class="pb-2" for="__checkbox__BusinessUnitUnsubscribes">BusinessUnitUnsubscribes</label>
                        </div>
                        <div class="col-5">
                            <input class="mb-2" type="number" id="__number__BusinessUnitUnsubscribes" name="dataViewsInput" value="5000">
                        </div>
                        <div class="col-3">
                            <label class="pb-2" for="__ent__BusinessUnitUnsubscribes">ENT</label>
                            <input class="pb-2 ent" type="checkbox" id="__ent__BusinessUnitUnsubscribes" name="entInput">
                        </div>
					</div>
                    <div class="row">
						<div class="col-4">
                            <input class="pb-2 dv_enable" type="checkbox" id="__checkbox__Click" name="dataViewsInput" value="Click">
                            <label class="pb-2" for="__checkbox__Click">Click</label>
                        </div>
                        <div class="col-5">
                            <input class="mb-2" type="number" id="__number__Click" name="dataViewsInput" value="5000">
                        </div>
                        <div class="col-3">
                            <label class="pb-2" for="__ent__Click">ENT</label>
                            <input class="pb-2 ent" type="checkbox" id="__ent__Click" name="entInput">
                        </div>
					</div>
                    <div class="row">
						<div class="col-4">
                            <input class="pb-2 dv_enable" type="checkbox" id="__checkbox__Complaint" name="dataViewsInput" value="Complaint">
                            <label class="pb-2" for="__checkbox__Complaint">Complaint</label>
                        </div>
                        <div class="col-5">
                            <input class="mb-2" type="number" id="__number__Complaint" name="dataViewsInput" value="5000">
                        </div>
                        <div class="col-3">
                            <label class="pb-2" for="__ent__Complaint">ENT</label>
                            <input class="pb-2 ent" type="checkbox" id="__ent__Complaint" name="entInput">
                        </div>
					</div>
                    <div class="row">
						<div class="col-4">
                            <input class="pb-2 dv_enable" type="checkbox" id="__checkbox__Coupon" name="dataViewsInput" value="Coupon">
                            <label class="pb-2" for="__checkbox__Coupon">Coupon</label>
                        </div>
                        <div class="col-5">
                            <input class="mb-2" type="number" id="__number__Coupon" name="dataViewsInput" value="5000">
                        </div>
                        <div class="col-3">
                            <label class="pb-2" for="__ent__Coupon">ENT</label>
                            <input class="pb-2 ent" type="checkbox" id="__ent__Coupon" name="entInput">
                        </div>
					</div>
                    <div class="row">
						<div class="col-4">
                            <input class="pb-2 dv_enable" type="checkbox" id="__checkbox__FTAF" name="dataViewsInput" value="FTAF">
                            <label class="pb-2" for="__checkbox__FTAF">FTAF</label>
                        </div>
                        <div class="col-5">
                            <input class="mb-2" type="number" id="__number__FTAF" name="dataViewsInput" value="5000">
                        </div>
                        <div class="col-3">
                            <label class="pb-2" for="__ent__FTAF">ENT</label>
                            <input class="pb-2 ent" type="checkbox" id="__ent__FTAF" name="entInput">
                        </div>
					</div>
                    <div class="row">
						<div class="col-4">
                            <input class="pb-2 dv_enable" type="checkbox" id="__checkbox__Job" name="dataViewsInput" value="Job">
                            <label class="pb-2" for="__checkbox__Job">Job</label>
                        </div>
                        <div class="col-5">
                            <input class="mb-2" type="number" id="__number__Job" name="dataViewsInput" value="5000">
                        </div>
                        <div class="col-3">
                            <label class="pb-2" for="__ent__Job">ENT</label>
                            <input class="pb-2 ent" type="checkbox" id="__ent__Job" name="entInput">
                        </div>
					</div>
                    <div class="row">
						<div class="col-4">
                            <input class="pb-2 dv_enable" type="checkbox" id="__checkbox__Journey" name="dataViewsInput" value="Journey">
                            <label class="pb-2" for="__checkbox__Journey">Journey</label>
                        </div>
                        <div class="col-5">
                            <input class="mb-2" type="number" id="__number__Journey" name="dataViewsInput" value="5000">
                        </div>
                        <div class="col-3">
                            <label class="pb-2" for="__ent__Journey">ENT</label>
                            <input class="pb-2 ent" type="checkbox" id="__ent__Journey" name="entInput">
                        </div>
					</div>
                    <div class="row">
						<div class="col-4">
                            <input class="pb-2 dv_enable" type="checkbox" id="__checkbox__JourneyActivity" name="dataViewsInput" value="JourneyActivity">
                            <label class="pb-2" for="__checkbox__JourneyActivity">JourneyActivity</label>
                        </div>
                        <div class="col-5">
                            <input class="mb-2" type="number" id="__number__JourneyActivity" name="dataViewsInput" value="5000">
                        </div>
                        <div class="col-3">
                            <label class="pb-2" for="__ent__JourneyActivity">ENT</label>
                            <input class="pb-2 ent" type="checkbox" id="__ent__JourneyActivity" name="entInput">
                        </div>
					</div>
                    <div class="row">
						<div class="col-4">
                            <input class="pb-2 dv_enable" type="checkbox" id="__checkbox__ListSubscribers" name="dataViewsInput" value="ListSubscribers">
                            <label class="pb-2" for="__checkbox__ListSubscribers">ListSubscribers</label>
                        </div>
                        <div class="col-5">
                            <input class="mb-2" type="number" id="__number__ListSubscribers" name="dataViewsInput" value="5000">
                        </div>
                        <div class="col-3">
                            <label class="pb-2" for="__ent__ListSubscribers">ENT</label>
                            <input class="pb-2 ent" type="checkbox" id="__ent__ListSubscribers" name="entInput">
                        </div>
					</div>
                    <div class="row">
						<div class="col-4">
                            <input class="pb-2 dv_enable" type="checkbox" id="__checkbox__MobileLineAddressContactSubscriptionView" name="dataViewsInput" value="MobileLineAddressContactSubscriptionView">
                            <label class="pb-2" for="__checkbox__MobileLineAddressContactSubscriptionView">MobileLineAddressContactSubscriptionView</label>
                        </div>
                        <div class="col-5">
                            <input class="mb-2" type="number" id="__number__MobileLineAddressContactSubscriptionView" name="dataViewsInput" value="5000">
                        </div>
                        <div class="col-3">
                            <label class="pb-2" for="__ent__MobileLineAddressContactSubscriptionView">ENT</label>
                            <input class="pb-2 ent" type="checkbox" id="__ent__MobileLineAddressContactSubscriptionView" name="entInput">
                        </div>
					</div>
                    <div class="row">
						<div class="col-4">
                            <input class="pb-2 dv_enable" type="checkbox" id="__checkbox__MobileLineOrphanContactView" name="dataViewsInput" value="MobileLineOrphanContactView">
                            <label class="pb-2" for="__checkbox__MobileLineOrphanContactView">MobileLineOrphanContactView</label>
                        </div>
                        <div class="col-5">
                            <input class="mb-2" type="number" id="__number__MobileLineOrphanContactView" name="dataViewsInput" value="5000">
                        </div>
                        <div class="col-3">
                            <label class="pb-2" for="__ent__MobileLineOrphanContactView">ENT</label>
                            <input class="pb-2 ent" type="checkbox" id="__ent__MobileLineOrphanContactView" name="entInput">
                        </div>
					</div>
                    <div class="row">
						<div class="col-4">
                            <input class="pb-2 dv_enable" type="checkbox" id="__checkbox__Open" name="dataViewsInput" value="Open">
                            <label class="pb-2" for="__checkbox__Open">Open</label>
                        </div>
                        <div class="col-5">
                            <input class="mb-2" type="number" id="__number__Open" name="dataViewsInput" value="5000">
                        </div>
                        <div class="col-3">
                            <label class="pb-2" for="__ent__Open">ENT</label>
                            <input class="pb-2 ent" type="checkbox" id="__ent__Open" name="entInput">
                        </div>
					</div>
                    <div class="row">
						<div class="col-4">
                            <input class="pb-2 dv_enable" type="checkbox" id="__checkbox__Sent" name="dataViewsInput" value="Sent">
                            <label class="pb-2" for="__checkbox__Sent">Sent</label>
                        </div>
                        <div class="col-5">
                            <input class="mb-2" type="number" id="__number__Sent" name="dataViewsInput" value="5000">
                        </div>
                        <div class="col-3">
                            <label class="pb-2" for="__ent__Sent">ENT</label>
                            <input class="pb-2 ent" type="checkbox" id="__ent__Sent" name="entInput">
                        </div>
					</div>
                    <div class="row">
						<div class="col-4">
                            <input class="pb-2 dv_enable" type="checkbox" id="__checkbox__smsmessagetracking" name="dataViewsInput" value="smsmessagetracking">
                            <label class="pb-2" for="__checkbox__smsmessagetracking">smsmessagetracking</label>
                        </div>
                        <div class="col-5">
                            <input class="mb-2" type="number" id="__number__smsmessagetracking" name="dataViewsInput" value="5000">
                        </div>
                        <div class="col-3">
                            <label class="pb-2" for="__ent__smsmessagetracking">ENT</label>
                            <input class="pb-2 ent" type="checkbox" id="__ent__smsmessagetracking" name="entInput">
                        </div>
					</div>
                    <div class="row">
						<div class="col-4">
                            <input class="pb-2 dv_enable" type="checkbox" id="__checkbox__SocialNetworkImpressions" name="dataViewsInput" value="SocialNetworkImpressions">
                            <label class="pb-2" for="__checkbox__SocialNetworkImpressions">SocialNetworkImpressions</label>
                        </div>
                        <div class="col-5">
                            <input class="mb-2" type="number" id="__number__SocialNetworkImpressions" name="dataViewsInput" value="5000">
                        </div>
                        <div class="col-3">
                            <label class="pb-2" for="__ent__SocialNetworkImpressions">ENT</label>
                            <input class="pb-2 ent" type="checkbox" id="__ent__SocialNetworkImpressions" name="entInput">
                        </div>
					</div>
                    <div class="row">
						<div class="col-4">
                            <input class="pb-2 dv_enable" type="checkbox" id="__checkbox__SocialNetworkTracking" name="dataViewsInput" value="SocialNetworkTracking">
                            <label class="pb-2" for="__checkbox__SocialNetworkTracking">SocialNetworkTracking</label>
                        </div>
                        <div class="col-5">
                            <input class="mb-2" type="number" id="__number__SocialNetworkTracking" name="dataViewsInput" value="5000">
                        </div>
                        <div class="col-3">
                            <label class="pb-2" for="__ent__SocialNetworkTracking">ENT</label>
                            <input class="pb-2 ent" type="checkbox" id="__ent__SocialNetworkTracking" name="entInput">
                        </div>
					</div>
                    <div class="row">
						<div class="col-4">
                            <input class="pb-2 dv_enable" type="checkbox" id="__checkbox__Subscribers" name="dataViewsInput" value="Subscribers">
                            <label class="pb-2" for="__checkbox__Subscribers">Subscribers</label>
                        </div>
                        <div class="col-5">
                            <input class="mb-2" type="number" id="__number__Subscribers" name="dataViewsInput" value="5000">
                        </div>
                        <div class="col-3">
                            <label class="pb-2" for="__ent__Subscribers">ENT</label>
                            <input class="pb-2 ent" type="checkbox" id="__ent__Subscribers" name="entInput">
                        </div>
					</div>
                    <div class="row">
						<div class="col-4">
                            <input class="pb-2 dv_enable" type="checkbox" id="__checkbox__SMSSubscriptionLog" name="dataViewsInput" value="SMSSubscriptionLog">
                            <label class="pb-2" for="__checkbox__SMSSubscriptionLog">SMSSubscriptionLog</label>
                        </div>
                        <div class="col-5">
                            <input class="mb-2" type="number" id="__number__SMSSubscriptionLog" name="dataViewsInput" value="5000">
                        </div>
                        <div class="col-3">
                            <label class="pb-2" for="__ent__SMSSubscriptionLog">ENT</label>
                            <input class="pb-2 ent" type="checkbox" id="__ent__SMSSubscriptionLog" name="entInput">
                        </div>
					</div>
                    <div class="row">
						<div class="col-4">
                            <input class="pb-2 dv_enable" type="checkbox" id="__checkbox__SurveyResponse" name="dataViewsInput" value="SurveyResponse">
                            <label class="pb-2" for="__checkbox__SurveyResponse">SurveyResponse</label>
                        </div>
                        <div class="col-5">
                            <input class="mb-2" type="number" id="__number__SurveyResponse" name="dataViewsInput" value="5000">
                        </div>
                        <div class="col-3">
                            <label class="pb-2" for="__ent__SurveyResponse">ENT</label>
                            <input class="pb-2 ent" type="checkbox" id="__ent__SurveyResponse" name="entInput">
                        </div>
					</div>
                    <div class="row">
						<div class="col-4">
                            <input class="pb-2 dv_enable" type="checkbox" id="__checkbox__UndeliverableSms" name="dataViewsInput" value="UndeliverableSms">
                            <label class="pb-2" for="__checkbox__UndeliverableSms">UndeliverableSms</label>
                        </div>
                        <div class="col-5">
                            <input class="mb-2" type="number" id="__number__UndeliverableSms" name="dataViewsInput" value="5000">
                        </div>
                        <div class="col-3">
                            <label class="pb-2" for="__ent__UndeliverableSms">ENT</label>
                            <input class="pb-2 ent" type="checkbox" id="__ent__UndeliverableSms" name="entInput">
                        </div>
					</div>
                    <div class="row">
						<div class="col-4">
                            <input class="pb-2 dv_enable" type="checkbox" id="__checkbox__Unsubscribe" name="dataViewsInput" value="Unsubscribe">
                            <label class="pb-2" for="__checkbox__Unsubscribe">Unsubscribe</label>
                        </div>
                        <div class="col-5">
                            <input class="mb-2" type="number" id="__number__Unsubscribe" name="dataViewsInput" value="5000">
                        </div>
                        <div class="col-3">
                            <label class="pb-2" for="__ent__Unsubscribe">ENT</label>
                            <input class="pb-2 ent" type="checkbox" id="__ent__Unsubscribe" name="entInput">
                        </div>
					</div>
                
                <div class="row">
                    <div class="col">
                        <button class="btn btn-light" id="downloadDV" onclick="submit()">
                            Download Data Views
                        </button>
                    </div>
                </div>
                <br/>
            </div>
        
        </body>
        
        </html>`;
    }
}