### Overview
The Aprimo Power Tool AI Translation application will translate metadata fields in **Aprimo DAM** and update the metadata field in the target language with the translation. This application integrates with [Aprimo DAM Rules](https://developers.aprimo.com/docs/webhooks-and-rules/dam-rules), a powerful webhook-based automation system in Aprimo DAM. Rules allow for extensive customization in trigger conditions so the AI Translation service can run when it best suits your organization's use case. Once triggered, the Rule will send a webhook to this application, which will organize the data sent and call an [Azure Translator](https://azure.microsoft.com/en-us/products/ai-services/ai-translator) to translate the data, and then update the appropriate fields in Aprimo DAM with the new translated data.

**The Aprimo Power Tool AI Translation application is offered Open Source as-is.**

### Prerequisites
- Aprimo DAM
- Azure Subscription
- Azure Translator Resource

:::warning
This application is built to be used with Azure, if you would like to customize it for a different API translator service your organization will need to perform that customization. Aprimo offers this application Open Source as is.
:::

### Local Setup
- Clone this Repo.
- Run `npm install`.
- Create a .env file in the base directory.
- Provide the required data in the `.env` environment variables.
  - See [Aprimo Config](#aprimo-config) and [Azure Config](#azure-config)
- Run `npm start`

#### Aprimo Config
This application make use of Aprimo's `client_credentials` [OAuth](https://developers.aprimo.com/docs/OAuth2) flow.
- Create a Client Registration in your Aprimo environment
  - Set the Authorization Flow to Client Credentials
  - Store the `client_id` and `client_secret` to be used in the `.env` environment variable file. 
- Fields
  - Metadata fields in Aprimo DAM are set to either `single` or `multiple` language mode during Field Definition creation and this value can not be changed once created.
  - Create, or identify, the fields in Aprimo DAM that will be used by the AI Translation application.
    - When creating or modifying fields set to `multiple` language mode you can set which languages are approved for the field. Which languages are approved for the field can be changed later.
- Rules
The AI Translation integration uses DAM Rules to trigger the application. Learn about [Aprimo DAM Rules here](https://developers.aprimo.com/docs/webhooks-and-rules/dam-rules). For example DAM Rules, see [Rules Examples](#rules-examples)

#### Azure Config
- Login to your organization's Azure Subscription.
- Search for `Translator` services.
- Create a new `Translator service.
- Store the `api_key`, `region`, and `endpoint` to be used in the `.env` environment variables file.

### Hosting
- This application is built entire in Node.js can be deployed to any hosting provider that supports Node.js

### Environment Variables
Below is a sanitized `.env` environment variable file example

```ini
PORT=
WEBHOOK_SECRET=your_webhook_secret
APRIMO_DAM_URL=https://your_aprimo_tenant.dam.aprimo.com
APRIMO_AUTH_URL=https://your_aprimo_tenant.aprimo.com
APRIMO_CLIENT_ID=12345678-ABCD
APRIMO_CLIENT_SECRET=password
AZURE_TRANSLATOR_KEY=1234567890
AZURE_TRANSLATOR_REGION=your_translator_region
AZURE_TRANSLATOR_ENDPOINT=your_translator_endpoint
```
### Aprimo DAM Rule Webhook Scheme (OpenAPI)
Below is the OpenAPI schema for the Webhook defined in the AI Translator application. This schema represents the JSON body the Aprimo DAM Rule webhook will send. The AI Translator application will validate the request's body.

```yaml
components:
  schemas:
    Webhook:
      type: object
      required:
        - recordId
        - translations
      properties:
        recordId:
          type: string
        translations:
          type: array
          minItems: 1
          items:
            type: object
            required:
              - source
              - destinations
            properties:
              source:
                type: object
                required: [languages]
                properties:
                  fieldName:
                    type: string
                    nullable: true
                  fieldNames:
                    type: array
                    nullable: true
                    items:
                      type: string
                  languages:
                    type: array
                    minItems: 1
                    items:
                      type: string
                oneOf:
                  - required: ["fieldName"]
                    not:
                      required: ["fieldNames"]
                  - required: ["fieldNames"]
                    not:
                      required: ["fieldName"]
                  - not:
                      anyOf:
                        - required: ["fieldName"]
                        - required: ["fieldNames"]
              destinations:
                type: array
                minItems: 1
                items:
                  type: object
                  required: [recordId, languages]
                  properties:
                    recordId:
                      type: string
                    fieldName:
                      type: string
                      nullable: true
                    languages:
                      type: array
                      minItems: 1
                      items:
                        type: string

```

### Rules Examples
Aprimo DAM Rules HTTP Callouts are defined in `xml`. Below are some examples.
- Variables
  - `your_application_url` - The url you have hosted the Aprimo AI Translation application at.
  - `webhook_secret` - The Webhook Secret you defined in the `.env` environment variables file. The Aprimo AI Translation application will validate this secret.
```xml
<ref:httpRequest uri="{your_application_url}/api/webhook" timeout="15">
<Request>
<Headers>
<Header name="Authorization">Bearer {webhook_secret}</Header>
</Headers>
<Body>
{
  "recordId": <ref:record out="id" encode="json" />,
  "modifiedOn": <ref:record out="modifiedonutc" format="yyyy-MM-ddTHH:mm:ss.fff" encode="json" />,
  "modifiedBy": <ref:record out="modifiedby" format="N" encode="json" />,
  "translations": [
    {
      "source": {
        "fieldName": "AssetDescription",
        "languages": ["en-US"]
      },
      "destinations": [
        {
          "recordId": <ref:record out="id" encode="json" />,
          "fieldName": "TranslatedDescription",
          "languages": ["zh-CN"]
        },
        <ref:record fieldName="RelationshipLInk" out="valuechildren" store="@children" />
        <ref:foreach in="@children" storeitem="@child" join=",">
        {
          "recordId": <ref:record id="@child" out="id" encode="json" />,
          "fieldName": "TranslatedDescription",
          "languages": ["zh-CN"]
        }
        </ref:foreach>
      ]
    }
  ]
}
</Body>
</Request>
</ref:httpRequest>
```

```xml
<ref:httpRequest uri="{your_application_url}/api/webhook" timeout="15">
<Request>
<Headers>
<Header name="Authorization">Bearer {webhook_secret}</Header>
</Headers>
<Body>
{
  "recordId": <ref:record out="id" encode="json" />,
  "modifiedOn": <ref:record out="modifiedonutc" format="yyyy-MM-ddTHH:mm:ss.fff" encode="json" />,
  "modifiedBy": <ref:record out="modifiedby" format="N" encode="json" />,
  "translations": [
    {
      "source": {
        "fieldName": "EliteDescription",
        "languages": ["en-US"]
      },
      "destinations": [
        <ref:record fieldName="RelationshipLInk" out="valuechildren" store="@children" />
        <ref:foreach in="@children" storeitem="@child" join=",">
        {
          "recordId": <ref:record id="@child" out="id" encode="json" />,
          "fieldName": "EliteDescriptionML",
          "languages": ["zh-CN", "zh-TW"]
        }
        </ref:foreach>
      ]
    },
    {
      "source": {
        "fieldName": "EliteImageDescription",
        "languages": ["en-US"]
      },
      "destinations": [
        <ref:record fieldName="RelationshipLInk" out="valuechildren" store="@children" />
        <ref:foreach in="@children" storeitem="@child" join=",">
        {
          "recordId": <ref:record id="@child" out="id" encode="json" />,
          "fieldName": "EliteImageDescriptionML",
          "languages": ["zh-CN", "zh-TW"]
        }
        </ref:foreach>
      ]
    },
    {
      "source": {
        "fieldName": "EliteTags",
        "languages": ["en-US"]
      },
      "destinations": [
        <ref:record fieldName="RelationshipLInk" out="valuechildren" store="@children" />
        <ref:foreach in="@children" storeitem="@child" join=",">
        {
          "recordId": <ref:record id="@child" out="id" encode="json" />,
          "fieldName": "EliteTagsML",
          "languages": ["zh-CN", "zh-TW"]
        }
        </ref:foreach>
      ]
    }
  ]
}
</Body>
</Request>
</ref:httpRequest>
```

```xml
<ref:httpRequest uri="{your_application_url}/api/webhook" timeout="15">
<Request>
<Headers>
<Header name="Authorization">Bearer {webhook_secret}</Header>
</Headers>
<Body>
{
  "recordId": <ref:record out="id" encode="json" />,
  "modifiedOn": <ref:record out="modifiedonutc" format="yyyy-MM-ddTHH:mm:ss.fff" encode="json" />,
  "modifiedBy": <ref:record out="modifiedby" format="N" encode="json" />,
  "translations": [
    {
      "source": {
        "fieldNames": ["!AssetDescription", "SomeOtherField"],
        "languages": ["en-US"]
      },
      "destinations": [
        {
          "recordId": <ref:record out="id" encode="json" />,
          "languages": ["zh-CN"]
        },
        <ref:record fieldName="RelationshipLInk" out="valuechildren" store="@children" />
        <ref:foreach in="@children" storeitem="@child" join=",">
        {
          "recordId": <ref:record id="@child" out="id" encode="json" />,
          "languages": ["zh-CN"]
        }
        </ref:foreach>
      ]
    }
  ]
}
</Body>
</Request>
</ref:httpRequest>
```

```xml
<ref:httpRequest uri="{your_application_url}/api/webhook" timeout="15">
<Request>
<Headers>
<Header name="Authorization">Bearer {webhook_secret}</Header>
</Headers>
<Body>
{
  "recordId": <ref:record out="id" encode="json" />,
  "modifiedOn": <ref:record out="modifiedonutc" format="yyyy-MM-ddTHH:mm:ss.fff" encode="json" />,
  "modifiedBy": <ref:record out="modifiedby" format="N" encode="json" />,
  "translations": [
    {
      "source": {
        "languages": ["en-US"]
      },
      "destinations": [
        <ref:record fieldName="RelationshipLInk" out="valuechildren" store="@children" />
        <ref:foreach in="@children" storeitem="@child" join=",">
        {
          "recordId": <ref:record id="@child" out="id" encode="json" />,
          "languages": ["zh-CN", "fr-FR"]
        }
        </ref:foreach>
      ]
    }
  ]
}
</Body>
</Request>
</ref:httpRequest>
```